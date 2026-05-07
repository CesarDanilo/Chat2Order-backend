import { prisma } from "../config/prisma";
 import bcrypt from "bcrypt";
 
interface Usertype {
    id: string;
    name: string;
    email: string;
    password: string;
}

interface UsertypeUpdate {
    name: string;
    email: string;
    password: string;
}

export class UserService{
  async createUser(userdata: Usertype) {
    const user = await prisma.user.create({
      data: {
        id: userdata.id,
        name: userdata.name,
        email: userdata.email,
        password: userdata.password,
      }
    })
    
    return user;
  }

  async GetAllUsers() {
    const users = await prisma.user.findMany()
    return users;
  }

  async GetUserById(id:string) {
    const user = await prisma.user.findUnique({ where: { id } })
    return user;
  }

  async DeleteUserById(id:string){
    const user = await prisma.user.delete({ where: { id: id }})
    return user;
  }

  async UpdateUserById(id: string, userdata: UsertypeUpdate) {
    try {
      const data: any = {
        name: userdata.name,
        email: userdata.email,
      };

      if (userdata.password) {
        data.password = await bcrypt.hash(userdata.password, 10);
      }

      const user = await prisma.user.update({
        where: { id },
        data,
      });

      return user;

    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('User not found');
      }

      throw new Error('Internal error');
    }
  }
}