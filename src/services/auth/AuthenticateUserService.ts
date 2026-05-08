import { IUserRepository } from "../../interfaces/IUserRepository";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


export class AuthenticateUserService{

  constructor(
    private usersRepository: IUserRepository
  ){}

  async execute (email: string, password: string){
    const user = await this.usersRepository.findByEmail(email);
    if (!user) throw new Error("Invalid credentials");

    const passwordMatch = await bcrypt.compare(password, user.password);
    if(!passwordMatch) throw new Error('Invalid credentials');

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, { expiresIn: '1d' });

    return {
      user: {
        "id": user.id,
        "name": user.name,
        "email": user.email
      },
      token: token
    };
  }
}

