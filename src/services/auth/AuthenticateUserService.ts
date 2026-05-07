import { prisma } from "../../config/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function AuthenticateUserService (email: string, password: string){
  const user = await prisma.user.findUnique( { where: { email } } );
  if (!user) throw new Error("User not found"); 

  const passwordMatch = await bcrypt.compare(password, user.password);
  if(!passwordMatch) throw new Error('Invalid credentials');

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '1d' });

  return {
    user: {
      "id": user.id,
      "name": user.name,
      "email": user.email
    },
    token: token
  };
}