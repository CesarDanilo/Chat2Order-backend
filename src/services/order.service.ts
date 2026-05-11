import { prisma } from "../config/prisma";
import { IOrderRepository } from "../interfaces/IOrderRepository";

export class OrderService {

  constructor(
    private orderRepository: IOrderRepository
  ){}

  async GetOrderById(id:string){
    const order = await this.orderRepository.findMany(id);
    return order;
  }
}