import { AppError } from "../shared/errors/AppError";
import {
  IOrderRepository,
  type CreateOrderInput,
} from "../interfaces/IOrderRepository";
import { Pagination } from "../shared/validation/common";
import { canCreateWith, canTransition } from "./orderStatus";
import { calculateOrderTotals } from "./orderTotals";

export class OrderService {
  constructor(private orderRepository: IOrderRepository) {}

  async GetOrderByUserId(userId: string, pagination: Pagination) {
    const [orders, total] = await Promise.all([
      this.orderRepository.findManyByUserId(userId, pagination),
      this.orderRepository.countByUserId(userId),
    ]);

    return { orders, total };
  }

  async GetOrderById(orderId: string, ownerId: string) {
    return await this.orderRepository.findByIdForOwner(orderId, ownerId);
  }

  async CreateOrder(data: CreateOrderInput, userId: string) {
    if (!canCreateWith(data.status)) {
      throw new AppError(400, "INVALID_STATE_TRANSITION", "Um pedido não pode ser criado com este status.");
    }

    const prepared = await this.prepare(data, userId);

    return await this.orderRepository.create({ ...prepared, userId });
  }

  async UpdateOrder(orderId: string, ownerId: string, data: CreateOrderInput) {
    const current = await this.orderRepository.findByIdForOwner(orderId, ownerId);

    if (!current) return null;

    if (!canTransition(current.status, data.status)) {
      throw new AppError(
        409,
        "INVALID_STATE_TRANSITION",
        "Este pedido não pode mudar para o status escolhido.",
      );
    }

    const prepared = await this.prepare(data, ownerId);
    const updated = await this.orderRepository.updateForOwner(
      orderId,
      ownerId,
      current.status,
      prepared,
    );

    // A gravação exige o status lido acima: nulo aqui significa que outra requisição mudou antes.
    if (!updated) {
      throw new AppError(409, "CONFLICT", "O pedido foi alterado por outra operação. Tente novamente.");
    }

    return updated;
  }

  async DeleteOrder(orderId: string, ownerId: string) {
    return await this.orderRepository.deleteForOwner(orderId, ownerId);
  }

  // Totais vêm sempre do servidor, e itens só podem apontar para produtos da mesma conta.
  private async prepare(data: CreateOrderInput, ownerId: string) {
    await this.assertProductsBelongTo(data.items, ownerId);

    return { ...data, ...calculateOrderTotals(data.items) };
  }

  private async assertProductsBelongTo(items: CreateOrderInput["items"], ownerId: string) {
    const productIds = [
      ...new Set(items.flatMap((item) => (item.productId ? [item.productId] : []))),
    ];

    if (productIds.length === 0) return;

    const owned = await this.orderRepository.countOwnedProducts(productIds, ownerId);

    if (owned !== productIds.length) {
      throw new AppError(400, "INVALID_PRODUCT", "O pedido tem um produto inválido.");
    }
  }
}
