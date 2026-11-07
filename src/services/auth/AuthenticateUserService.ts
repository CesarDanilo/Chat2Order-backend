import { randomBytes } from "node:crypto";
import { AppError } from "../../errors/AppError";
import { IUserRepository } from "../../interfaces/IUserRepository";
import bcrypt from "bcrypt";
import { issueToken } from "./sessionService";

// Comparado quando o e-mail não existe, para o tempo de resposta não revelar quem tem conta.
const UNUSED_HASH = bcrypt.hashSync(randomBytes(16).toString("hex"), 10);

export class AuthenticateUserService{

  constructor(
    private usersRepository: IUserRepository
  ){}

  async execute (email: string, password: string){
    const user = await this.usersRepository.findByEmail(email);

    const passwordMatch = await bcrypt.compare(password, user?.password ?? UNUSED_HASH);
    if(!user || !passwordMatch) {
      throw new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
    }

    const token = issueToken(user.id, user.tokenVersion);

    return {
      user: {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "admin": user.admin
      },
      token: token
    };
  }
}
