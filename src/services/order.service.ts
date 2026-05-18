import { prisma } from "../config/prisma";
import { IOrderRepository, type CreateOrderInput } from "../interfaces/IOrderRepository";

export class OrderService {

  constructor(
    private orderRepository: IOrderRepository
  ){}

  async GetOrderById(id:string){
    const order = await this.orderRepository.findMany(id);
    return order;
  }

  async CreateOrder(data:CreateOrderInput, id: string){
    data.userId = id
    const order = await this.orderRepository.create(data);
    return order;
  }

  async DeleteOrder(id:string){
    const order = await this.orderRepository.delete(id);
    return order;
  }
}