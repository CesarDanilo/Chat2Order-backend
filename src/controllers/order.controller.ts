import { Request, Response } from "express";
import { OrderService } from "../services/order.service";

export class OrderController {
  async GetOrders(req: Request, res: Response){
    const orderService = new OrderService();

    try{

      const orders = await orderService.GetOrderById((req as any).user.id);
      return res.json(orders);

    }catch(error: any){

      console.error("❌ Erro detalhado no OrderController:", error);

      return res.status(500).json({
        error: "Error processing order",
        message: error.message
      });
    }
  }
}