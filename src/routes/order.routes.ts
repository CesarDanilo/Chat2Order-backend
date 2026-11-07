import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authMiddleware } from "../modules/auth/presentation/authMiddleware";
import { validate } from "../shared/http/validate";
import { idParams, paginationQuery } from "../shared/validation/common";
import { orderSchema } from "../schemas/order.schema";

const router = Router();
const orderController = new OrderController();

router.get("/order", authMiddleware, validate({ query: paginationQuery }), orderController.GetOrders);
router.get("/order/{:id}", authMiddleware, validate({ params: idParams }), orderController.GetOrderById);
router.post("/order", authMiddleware, validate({ body: orderSchema }), orderController.CreateOrder);
router.put("/order/{:id}", authMiddleware, validate({ params: idParams, body: orderSchema }), orderController.UpdateOrder);
router.delete("/order/{:id}", authMiddleware, validate({ params: idParams }), orderController.DeleteOrder);

export default router;
