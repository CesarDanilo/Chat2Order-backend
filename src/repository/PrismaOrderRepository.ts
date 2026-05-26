import type { Order } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  IOrderRepository,
  type CreateOrderInput,
} from "../interfaces/IOrderRepository";

export class PrismaOrderRepository implements IOrderRepository {
  async findManyByUserId(userId: string) {
    return await prisma.order.findMany({
      where: {
        userId,
      },

      include: {
        items: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(orderId: string) {
    return await prisma.order.findUnique({
      where: {
        id: orderId,
      },

      include: {
        items: true,
      },
    });
  }

  async update(orderId: string, data: CreateOrderInput) {
    const { userId, items, ...rest } = data;

    return await prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        ...rest,

        items: {
          deleteMany: {},

          create: items,
        },
      },

      include: {
        items: true,
      },
    });
  }
  async create(data: CreateOrderInput) {
    const { userId, items, ...rest } = data;

    return await prisma.order.create({
      data: {
        ...rest,

        user: {
          connect: { id: userId },
        },

        items: items
          ? {
              create: items,
            }
          : undefined,
      },
    });
  }

  async delete(id: string) {
    return await prisma.order.delete({
      where: { id },
    });
  }
}
