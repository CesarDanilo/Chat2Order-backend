import { Order, Prisma } from "@prisma/client";
import { IOrderRepository, StoredOrderInput, OrderWithItems } from "../domain/IOrderRepository";
import { randomUUID } from "node:crypto";

export class FakeOrdersRepository implements IOrderRepository {
  private orders: OrderWithItems[] = [];

  private toItems(orderId: string, items: StoredOrderInput["items"]) {
    return items.map((item) => ({
      id: randomUUID(),
      orderId,
      productId: item.productId ?? null,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: new Prisma.Decimal(item.unitPrice),
      totalPrice: new Prisma.Decimal(item.totalPrice),
    }));
  }

  private findOwned(orderId: string, ownerId: string) {
    return this.orders.find(
      (order) => order.id === orderId && order.userId === ownerId,
    );
  }

  async create(data: StoredOrderInput): Promise<Order> {
    const id = randomUUID();
    const order: OrderWithItems = {
      id,
      userId: data.userId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      address: data.address,
      paymentMethod: data.paymentMethod,
      status: data.status,
      total: new Prisma.Decimal(data.total),
      source: data.source,
      rawMessage: null,
      createdAt: new Date(),
      items: this.toItems(id, data.items),
    };

    this.orders.push(order);
    return order;
  }

  async findManyByUserId(userId: string): Promise<Order[]> {
    return this.orders.filter((order) => order.userId === userId);
  }

  async countByUserId(userId: string): Promise<number> {
    return this.orders.filter((order) => order.userId === userId).length;
  }

  async findByIdForOwner(orderId: string, ownerId: string): Promise<Order | null> {
    return this.findOwned(orderId, ownerId) ?? null;
  }

  async updateForOwner(
    orderId: string,
    ownerId: string,
    expectedStatus: string,
    data: StoredOrderInput,
  ): Promise<Order | null> {
    const order = this.findOwned(orderId, ownerId);
    if (!order || order.status !== expectedStatus) return null;

    const { items, userId, total, ...rest } = data;
    Object.assign(order, rest, {
      total: new Prisma.Decimal(total),
      items: this.toItems(orderId, items),
    });
    return order;
  }

  async deleteForOwner(orderId: string, ownerId: string): Promise<Order | null> {
    const order = this.findOwned(orderId, ownerId);
    if (!order) return null;

    this.orders.splice(this.orders.indexOf(order), 1);
    return order;
  }

  async countOwnedProducts(productIds: string[]): Promise<number> {
    return productIds.length;
  }
}
