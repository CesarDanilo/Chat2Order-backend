import { prisma } from "../../../shared/database/prisma";
import { IProductRepository, CreateProducts, UpdateProducts } from "../domain/IProductsRepository";
import { Pagination, toSkipTake } from "../../../shared/validation/common";
import { nullIfNotFound } from "../../../shared/database/prismaErrors";

// Só estes campos vêm do corpo da requisição: o dono nunca é aceito dele.
function toProductFields(data: UpdateProducts) {
  return {
    name: data.name,
    description: data.description,
    price: data.price,
    category: data.category,
    available: data.available,
  };
}

export class PrismaProductsRepository implements IProductRepository {

  async create(data: CreateProducts) {
    return prisma.product.create({
      data: {
        ...toProductFields(data),
        name: data.name,
        price: data.price,
        user: {
          connect: { id: data.userId },
        },
      },
    });
  }

  async findByIdForOwner(productId: string, ownerId: string) {
    return prisma.product.findFirst({
      where: { id: productId, userId: ownerId },
    });
  }

  async findAllByUser(userId: string, pagination: Pagination) {
    return prisma.product.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      ...toSkipTake(pagination),
    });
  }

  async countByUser(userId: string) {
    return prisma.product.count({ where: { userId } });
  }

  async updateForOwner(productId: string, ownerId: string, data: UpdateProducts) {
    return nullIfNotFound(
      prisma.product.update({
        where: {
          id: productId,
          userId: ownerId,
        },
        data: toProductFields(data),
      }),
    );
  }

  async deleteForOwner(productId: string, ownerId: string) {
    return nullIfNotFound(
      prisma.product.delete({
        where: {
          id: productId,
          userId: ownerId,
        },
      }),
    );
  }
}
