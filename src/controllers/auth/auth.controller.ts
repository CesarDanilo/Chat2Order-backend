import { Request, Response } from "express";
import { AuthenticateUserService } from "../../services/auth/AuthenticateUserService";
import { PrismaUsersRepository } from "../../repository/PrismaUsersRepository";

export async function AuthenticateUserController(req: Request, res: Response) {

  try {

    const { email, password } = req.body;
    const usersRepository = new PrismaUsersRepository();
    const authenticateUserService = new AuthenticateUserService(usersRepository);
    const auth = await authenticateUserService.execute(email, password);
    return res.status(200).json(auth);

  } catch {

    return res.status(401).json({
      message: "Invalid credentials",
    });

  }
}