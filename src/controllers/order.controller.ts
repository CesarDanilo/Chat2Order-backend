import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { PrismaOrderRepository } from "../repository/PrismaOrderRepository";
import { OrderService } from "../services/order.service";

const orderNotFound = () => new AppError(404, "NOT_FOUND", "Pedido não encontrado");

const createService = () => new OrderService(new PrismaOrderRepository());

const ownerOf = (req: Request): string => (req as any).user.id;

const orderId = (req: Request) => String(req.params.id);

export class OrderController {
  async GetOrders(req: Request, res: Response) {
    const { orders, total } = await createService().GetOrderByUserId(ownerOf(req), res.locals.query);

    res.setHeader("X-Total-Count", total);

    return res.json(orders);
  }

  async GetOrderById(req: Request, res: Response) {
    const order = await createService().GetOrderById(orderId(req), ownerOf(req));

    if (!order) throw orderNotFound();

    return res.json(order);
  }

  async CreateOrder(req: Request, res: Response) {
    const order = await createService().CreateOrder(req.body, ownerOf(req));

    return res.json(order);
  }

  async UpdateOrder(req: Request, res: Response) {
    const order = await createService().UpdateOrder(orderId(req), ownerOf(req), req.body);

    if (!order) throw orderNotFound();

    return res.json(order);
  }

  async DeleteOrder(req: Request, res: Response) {
    const deleted = await createService().DeleteOrder(orderId(req), ownerOf(req));

    if (!deleted) throw orderNotFound();

    return res.status(200).json({ message: "Order deleted successfully" });
  }
}
