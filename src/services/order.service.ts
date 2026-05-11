import { prisma } from "../config/prisma";

export class OrderService {

  async GetOrderById(id:string){
    const order = await prisma.order.findMany({
      where:{
        userId: id,
      }
    });
    return order;
  }
}