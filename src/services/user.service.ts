import { prisma } from "../config/prisma";
 
interface Usertype {
    id: string;
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

  async UpdateUserById(id:string, userdata: Usertype) {
    const user = await prisma.user.update({
      data: {
        name: userdata.name,
        email: userdata.email,
        password: userdata.password,
      },
      where: { id }
    })
    return user;
  }
}