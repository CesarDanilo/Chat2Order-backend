import { OrderService } from "./application/order.service";
import { PrismaOrderRepository } from "./infrastructure/PrismaOrderRepository";

// API pública do módulo de pedidos. Outros módulos criam pedidos só por aqui.
export { default as orderRoutes } from "./presentation/order.routes";
export { PAYMENT_METHODS } from "./domain/orderValues";
export type { ImportedOrderInput } from "./domain/IOrderRepository";

export const createOrderService = () => new OrderService(new PrismaOrderRepository());
