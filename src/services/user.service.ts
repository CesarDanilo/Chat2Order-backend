import bcrypt from "bcrypt";
import { prisma } from "../shared/database/prisma";
import { AppError } from "../shared/errors/AppError";
import { Pagination, toSkipTake } from "../shared/validation/common";
import { CreateUserInput, UpdateUserInput } from "../schemas/user.schema";

// Lista fechada do que sai para a API: a senha nunca faz parte da resposta.
const publicUserFields = {
  id: true,
  name: true,
  email: true,
  admin: true,
  createdAt: true,
} as const;

// Contas antigas podem ter maiúsculas no e-mail, então a comparação não diferencia caixa.
async function assertEmailAvailable(email: string, exceptUserId?: string) {
  const taken = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      id: exceptUserId ? { not: exceptUserId } : undefined,
    },
    select: { id: true },
  });

  if (taken) {
    throw new AppError(409, "EMAIL_TAKEN", "Já existe um cadastro com este e-mail.");
  }
}

export class UserService{
  async createUser(userdata: CreateUserInput) {
    await assertEmailAvailable(userdata.email);

    const password = await bcrypt.hash(userdata.password, 10);

    return await prisma.user.create({
      data: {
        name: userdata.name,
        email: userdata.email,
        password,
      },
      select: publicUserFields,
    })
  }

  async GetAllUsers(pagination: Pagination) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: publicUserFields,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        ...toSkipTake(pagination),
      }),
      prisma.user.count(),
    ]);

    return { users, total };
  }

  async GetUserById(id:string) {
    return await prisma.user.findUnique({ where: { id }, select: publicUserFields })
  }

  async DeleteUserById(id:string){
    const target = await prisma.user.findUnique({ where: { id }, select: { admin: true } });

    if (target?.admin && (await prisma.user.count({ where: { admin: true } })) === 1) {
      throw new AppError(409, "LAST_ADMIN", "Não é possível excluir o último administrador.");
    }

    return await prisma.user.delete({ where: { id }, select: publicUserFields })
  }

  async UpdateUserById(id: string, userdata: UpdateUserInput) {
    await assertEmailAvailable(userdata.email, id);

    return await prisma.user.update({
      where: { id },
      data: {
        name: userdata.name,
        email: userdata.email,
        admin: userdata.admin,
        password: userdata.password
          ? await bcrypt.hash(userdata.password, 10)
          : undefined,
        // Senha nova encerra todas as sessões abertas com a anterior.
        tokenVersion: userdata.password ? { increment: 1 } : undefined,
      },
      select: publicUserFields,
    });
  }
}
