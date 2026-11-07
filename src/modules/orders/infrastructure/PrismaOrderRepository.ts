import { prisma } from "../../../shared/database/prisma";
import {
  IOrderRepository,
  type StoredOrderInput,
} from "../domain/IOrderRepository";
import { Pagination, toSkipTake } from "../../../shared/validation/common";
import { nullIfNotFound } from "../../../shared/database/prismaErrors";

// Só estes campos são gravados: dono e relações nunca vêm do corpo da requisição.
function toOrderFields(data: StoredOrderInput) {
  return {
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    address: data.address,
    paymentMethod: data.paymentMethod,
    status: data.status,
    total: data.total,
    source: data.source,
    rawMessage: data.rawMessage,
  };
}

export class PrismaOrderRepository implements IOrderRepository {
  async countByUserId(userId: string) {
    return await prisma.order.count({ where: { userId } });
  }

  async findManyByUserId(userId: string, pagination: Pagination) {
    return await prisma.order.findMany({
      where: {
        userId,
      },

      include: {
        items: true,
      },

      orderBy: [{ createdAt: "desc" }, { id: "asc" }],

      ...toSkipTake(pagination),
    });
  }

  async findByIdForOwner(orderId: string, ownerId: string) {
    return await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: ownerId,
      },

      include: {
        items: true,
      },
    });
  }

  async updateForOwner(
    orderId: string,
    ownerId: string,
    expectedStatus: string,
    data: StoredOrderInput,
  ) {
    return await nullIfNotFound(
      prisma.order.update({
        where: {
          id: orderId,
          userId: ownerId,
          status: expectedStatus,
        },

        data: {
          ...toOrderFields(data),

          items: {
            deleteMany: {},

            create: data.items,
          },

          history:
            data.status === expectedStatus ? undefined : { create: { status: data.status } },
        },

        include: {
          items: true,
        },
      }),
    );
  }

  async create(data: StoredOrderInput) {
    return await prisma.order.create({
      data: {
        ...toOrderFields(data),

        user: {
          connect: { id: data.userId },
        },

        items: {
          create: data.items,
        },

        history: {
          create: { status: data.status },
        },
      },
      include: {
        items: true,
      },
    });
  }

  async deleteForOwner(orderId: string, ownerId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: ownerId },
      select: { id: true },
    });

    if (!order) return null;

    // O histórico tem FK restritiva: precisa sair junto, na mesma transação.
    const [, deleted] = await prisma.$transaction([
      prisma.orderStatusHistory.deleteMany({ where: { orderId } }),
      prisma.order.delete({ where: { id: orderId } }),
    ]);

    return deleted;
  }

  async findRecentImport(userId: string, rawMessage: string, since: Date) {
    return await prisma.order.findFirst({
      where: { userId, source: "WHATSAPP", rawMessage, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });
  }

  async countOwnedProducts(productIds: string[], ownerId: string) {
    return await prisma.product.count({
      where: { id: { in: productIds }, userId: ownerId },
    });
  }
}
