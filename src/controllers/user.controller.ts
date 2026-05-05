import { Request, Response } from "express";
import { UserService } from "../services/user.service";

export class UserController{
  async CreateUserController(req: Request, res: Response) {
    const userService = new UserService();
    try {
      console.log("entrando no controller")
      const result = await userService.createUser(req.body);
      return res.status(201).json(result);
    }catch(error){
      return res.status(500)
    }
  }
}