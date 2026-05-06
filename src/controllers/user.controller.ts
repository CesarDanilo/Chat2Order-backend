import { Request, Response } from "express";
import { UserService } from "../services/user.service";

export class UserController{
  async CreateUserController(req: Request, res: Response) {
    const userService = new UserService();

    try {
      const result = await userService.createUser(req.body);
      return res.status(201).json(result);
    }catch(error){
      return res.status(500)
    }
  }

  async GetAllUsersController(req: Request, res: Response){
    const userService = new UserService();

    try{
      const result = await userService.GetAllUsers();
      return res.status(200).json(result);
    }catch(error){
      return res.status(500);
    }
  }

  async GetUserByIdController(req: Request<{ id: string }>, res: Response) {
    const userService = new UserService();

    if(!req.params.id) throw new Error("id is required");

    const { id } = req.params;
    try{
      const result = await userService.GetUserById(id);
      return res.status(200).json(result);
    }catch(error){
      return res.status(500);
    }
  }

  async DeleteUserByIdController(req: Request<{ id:string }> , res: Response){
    const userService = new UserService();
    if(!req.params.id) throw new Error("id is required");
    const { id } = req.params;
    try{
      const result = await userService.DeleteUserById(id);
      return res.status(204).json(result);
    }catch(error){
      return res.status(500);
    }
  }

  async UpdateUserByIdController(req: Request<{ id: string }>, res: Response) {
    const userService = new UserService();
    if(!req.params.id || !req.body.name || !req.body.email || !req.body.password) throw new Error("id, name, email and password are required");

    const { id } = req.params;
    const userdata = req.body;

    try{
      const result = await userService.UpdateUserById(id, userdata);
      return res.status(204).json(result);
    }catch(error){
      return res.status(500);
    }
  }
  
}