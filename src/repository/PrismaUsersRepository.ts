import { prisma } from "../config/prisma";
import {
  IUserRepository,
  CreateUserDTO
} from "../interfaces/IUserRepository";

export class PrismaUsersRepository implements IUserRepository {

    async create(data: CreateUserDTO) {
      return prisma.user.create({
        data,
      });
    }

    async findByEmail(email: string) {
      return prisma.user.findUnique({
        where: {
          email,
        },
      });
    }

    async findById(id: string) {
      return prisma.user.findUnique({
        where: {
          id,
        },
      });
    }
}