import { Order, OrderItem } from "@prisma/client";
import { Pagination } from "../shared/validation/common";

export type OrderWithItems = Order & {
  items: OrderItem[];
};

interface IItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  productId?: string;
}

export interface CreateOrderInput {
  userId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  source: string;
  address: string;
  paymentMethod: string;
  rawMessage?: string | null;
  items: IItem[];
  total?: number;
}

export type StoredOrderInput = Omit<CreateOrderInput, "items" | "total"> & {
  items: (IItem & { totalPrice: number })[];
  total: number;
};

// Todo acesso por id exige o dono: não existe consulta de pedido sem ownerId.
export interface IOrderRepository {
  findManyByUserId(userId: string, pagination: Pagination): Promise<Order[]>;

  countByUserId(userId: string): Promise<number>;

  findByIdForOwner(orderId: string, ownerId: string): Promise<Order | null>;

  updateForOwner(
    orderId: string,
    ownerId: string,
    expectedStatus: string,
    data: StoredOrderInput,
  ): Promise<Order | null>;

  create(data: StoredOrderInput): Promise<Order>;

  deleteForOwner(orderId: string, ownerId: string): Promise<Order | null>;

  countOwnedProducts(productIds: string[], ownerId: string): Promise<number>;
}
