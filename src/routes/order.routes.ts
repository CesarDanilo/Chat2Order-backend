import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authMiddleware } from "../middleware/authUser";

const router = Router();
const orderController = new OrderController();

router.get("/order", authMiddleware, orderController.GetOrders);
router.get("/order/{:id}", authMiddleware, orderController.GetOrderById);
router.post("/order", authMiddleware, orderController.CreateOrder);
router.put("/order/{:id}", authMiddleware, orderController.UpdateOrder);
router.delete("/order/{:id}", authMiddleware, orderController.DeleteOrder);

export default router;
