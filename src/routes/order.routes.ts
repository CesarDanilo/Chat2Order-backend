import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authMiddleware } from "../middleware/authUser";

const router = Router();
const orderController = new OrderController();

router.get('/order', authMiddleware, orderController.GetOrders)

export default router;
