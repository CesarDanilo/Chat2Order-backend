import { prisma } from "../config/prisma";
 
interface Usertype {
    id: string;
    name: string;
    email: string;
    password: string;
}

export class UserService{
  async createUser(userdata: Usertype) {
    console.log("entrou no service")
    const user = await prisma.user.create({
      data: {
        id: userdata.id,
        name: userdata.name,
        email: userdata.email,
        password: userdata.password,
      }
    })
    
    return user
  }

  async GetAllUsers() {
    const users = await prisma.user.findMany()
    return users
  }
}