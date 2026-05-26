import { Order, OrderItem } from "@prisma/client";

export type OrderWithItems = Order & {
  items: OrderItem[];
};

interface IItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateOrderInput {
  userId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  source: string;
  address: string;
  paymentMethod: string;
  items: IItem[];
  total: number;
}

export interface IOrderRepository {
  findManyByUserId(userId: string): Promise<Order[]>;

  findById(orderId: string): Promise<Order | null>;

  update(orderId: string, data: CreateOrderInput): Promise<Order>;

  create(data: CreateOrderInput): Promise<Order>;

  delete(id: string): Promise<Order>;
}
