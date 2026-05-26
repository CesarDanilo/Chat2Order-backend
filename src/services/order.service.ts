import { prisma } from "../config/prisma";
import {
  IOrderRepository,
  type CreateOrderInput,
} from "../interfaces/IOrderRepository";

export class OrderService {
  constructor(private orderRepository: IOrderRepository) {}

  async GetOrderByUserId(userId: string) {
    return await this.orderRepository.findManyByUserId(userId);
  }

  async GetOrderById(orderId: string) {
    return await this.orderRepository.findById(orderId);
  }

  async CreateOrder(data: CreateOrderInput, userId: string) {
    data.userId = userId;

    return await this.orderRepository.create(data);
  }

  async UpdateOrder(orderId: string, data: CreateOrderInput) {
    return await this.orderRepository.update(orderId, data);
  }

  async DeleteOrder(id: string) {
    return await this.orderRepository.delete(id);
  }
}
