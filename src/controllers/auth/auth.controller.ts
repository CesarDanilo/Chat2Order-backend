import { Request, Response } from "express";
import { AuthenticateUserService } from "../../services/auth/AuthenticateUserService";
import { PrismaUsersRepository } from "../../repository/PrismaUsersRepository";

export async function AuthenticateUserController(req: Request, res: Response) {
  const { email, password } = req.body;
  const authenticateUserService = new AuthenticateUserService(new PrismaUsersRepository());
  const auth = await authenticateUserService.execute(email, password);

  return res.status(200).json(auth);
}
