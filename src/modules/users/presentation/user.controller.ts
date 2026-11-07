import { Request, Response } from "express";
import { AppError } from "../../../shared/errors/AppError";
import { UserService } from "../application/user.service";

export class UserController{
  async CreateUserController(req: Request, res: Response) {
    const result = await new UserService().createUser(req.body);

    return res.status(201).json(result);
  }

  async GetAllUsersController(req: Request, res: Response){
    const { users, total } = await new UserService().GetAllUsers(res.locals.query);

    res.setHeader("X-Total-Count", total);

    return res.status(200).json(users);
  }

  async GetUserByIdController(req: Request<{ id: string }>, res: Response) {
    const result = await new UserService().GetUserById(req.params.id);

    if (!result) throw new AppError(404, "NOT_FOUND", "Usuário não encontrado");

    return res.status(200).json(result);
  }

  async DeleteUserByIdController(req: Request<{ id:string }> , res: Response){
    const result = await new UserService().DeleteUserById(req.params.id);

    return res.status(204).json(result);
  }

  async UpdateUserByIdController(req: Request<{ id: string }>, res: Response) {
    const result = await new UserService().UpdateUserById(req.params.id, req.body);

    return res.status(200).json(result);
  }
}
