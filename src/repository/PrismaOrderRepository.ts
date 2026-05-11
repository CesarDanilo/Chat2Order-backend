import type { Order } from "@prisma/client";
import { prisma } from "../config/prisma";
import { IOrderRepository, type CreateOrderInput } from "../interfaces/IOrderRepository";

export class PrismaOrderRepository implements IOrderRepository{

  async findMany(id: string){
    const orders = await prisma.order.findMany({
        where: {
          userId: id,
        },
        include: {
          items: true,
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

    return orders;
  }

  async create(data: CreateOrderInput){
      const { userId, items, ...rest } = data;

      return await prisma.order.create({
        data: {
          ...rest,
          user: {
            connect: { id: userId }
          },
          items: items ? {
            create: items
          } : undefined
        }
      });
    }
}