import { prisma } from "../config/prisma";
import { IOrderRepository } from "../interfaces/IOrderRepository";

export class PrismaOrderRepository implements IOrderRepository{

  async findMany(id: string){
    return await prisma.order.findMany({
      where:{
        userId: id,
      }
    });
  }
}