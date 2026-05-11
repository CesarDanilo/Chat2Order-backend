import { Order } from "@prisma/client";

export interface IOrderRepository {
  findMany(userId: string): Promise<Order[] | null>;
}