import { Request, Response } from "express";
import { OrderService } from "../services/order.service";
import { PrismaOrderRepository } from "../repository/PrismaOrderRepository";

export class OrderController {
  async GetOrders(req: Request, res: Response) {
    const orderRepository = new PrismaOrderRepository();
    const orderService = new OrderService(orderRepository);

    try {
      const orders = await orderService.GetOrderByUserId((req as any).user.id);
      return res.json(orders);
    } catch (error: any) {
      console.error("❌ Erro detalhado no OrderController:", error);

      return res.status(500).json({
        error: "Error processing order",
        message: error.message,
      });
    }
  }

  async GetOrderById(req: Request, res: Response) {
    const orderRepository = new PrismaOrderRepository();
    const orderService = new OrderService(orderRepository);

    try {
      const id = String(req.params.id);

      const order = await orderService.GetOrderById(id);

      if (!order) {
        return res.status(404).json({
          message: "Pedido não encontrado",
        });
      }

      return res.json(order);
    } catch (error: any) {
      console.error("❌ Erro detalhado no OrderController:", error);

      return res.status(500).json({
        error: "Error processing order",
        message: error.message,
      });
    }
  }

  async CreateOrder(req: Request, res: Response) {
    const orderRepository = new PrismaOrderRepository();
    const orderService = new OrderService(orderRepository);

    try {
      const userId = (req as any).user.id;
      const order = await orderService.CreateOrder(req.body, userId);
      return res.json(order);
    } catch (error: any) {
      console.error("❌ Erro detalhado no OrderController:", error);

      return res.status(500).json({
        error: "Error processing order",
        message: error.message,
      });
    }
  }

  async UpdateOrder(req: Request, res: Response) {
    const orderRepository = new PrismaOrderRepository();
    const orderService = new OrderService(orderRepository);

    try {
      const { id } = req.params;

      if (!id || Array.isArray(id)) {
        return res.status(400).json({
          error: "ID inválido",
        });
      }

      const order = await orderService.UpdateOrder(id, req.body);

      return res.json(order);
    } catch (error: any) {
      console.error(error);

      return res.status(500).json({
        error: "Erro ao atualizar pedido",
        message: error.message,
      });
    }
  }

  async DeleteOrder(req: Request, res: Response) {
    const orderRepository = new PrismaOrderRepository();
    const orderService = new OrderService(orderRepository);

    try {
      const { id } = req.params as { id: string };

      if (!id) {
        return res.status(400).json({ error: "Missing order ID" });
      }

      await orderService.DeleteOrder(id);

      return res.status(200).json({ message: "Order deleted successfully" });
    } catch (error: any) {
      console.error("❌ Erro detalhado no OrderController:", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: error.message,
      });
    }
  }
}
