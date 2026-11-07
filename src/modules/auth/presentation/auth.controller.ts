import { Request, Response } from "express";
import { AuthenticateUserService } from "../application/AuthenticateUserService";
import { revoke } from "../application/sessionService";
import { PrismaUsersRepository } from "../infrastructure/PrismaUsersRepository";

export async function AuthenticateUserController(req: Request, res: Response) {
  const { email, password } = req.body;
  const authenticateUserService = new AuthenticateUserService(new PrismaUsersRepository());
  const auth = await authenticateUserService.execute(email, password);

  return res.status(200).json(auth);
}

export async function LogoutController(req: Request, res: Response) {
  await revoke((req as any).session);

  return res.status(204).end();
}
