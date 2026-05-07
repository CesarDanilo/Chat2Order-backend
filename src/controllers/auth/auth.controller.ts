import { Request, Response } from "express"; 
import { AuthenticateUserService } from "../../services/auth/AuthenticateUserService";

export async function AuthenticateUserController (req: Request, res: Response) {
  try{
    const { email, password } = req.body;

    const auth  = await AuthenticateUserService(email, password);

    return res.status(200).json(auth);

  }catch(error){
    return res.status(401).json({ message: "Invalid credentials"})
  }
 }