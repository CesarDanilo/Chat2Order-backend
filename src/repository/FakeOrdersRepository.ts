import { Order, OrderItem } from "@prisma/client";
import { IOrderRepository, CreateOrderInput, OrderWithItems } from "../interfaces/IOrderRepository";
import { randomUUID } from "node:crypto";

export class FakeOrdersRepository implements IOrderRepository {
  private orders: OrderWithItems[] = [];

  async create(data: CreateOrderInput): Promise<Order> {
    const newOrder: Order = {
      id: randomUUID(),
      userId: data.userId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      address: data.address,
      paymentMethod: data.paymentMethod,
      status: data.status,
      total: data.total,
      source: data.source,
      rawMessage: null,
      createdAt: new Date(),
    };

    const orderWithItems: OrderWithItems = {
      ...newOrder,
      items: data.items.map(item => ({
        id: randomUUID(),
        orderId: newOrder.id,
        ...item
      }))
    };

    this.orders.push(orderWithItems);
    return newOrder; 
  }

  async findMany(userId: string): Promise<OrderWithItems[] | null> {
    const userOrders = this.orders.filter(o => o.userId === userId);
    return userOrders.length > 0 ? userOrders : [];
  }

  async delete(id: string): Promise<Order | null> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) return null;
    
    const deleted = this.orders[index];
    this.orders.splice(index, 1);
    return deleted;
  }
}