import { Request, Response } from "express";
import { AuthenticateUserService } from "../../services/auth/AuthenticateUserService";
import { revoke } from "../../services/auth/sessionService";
import { PrismaUsersRepository } from "../../repository/PrismaUsersRepository";

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
