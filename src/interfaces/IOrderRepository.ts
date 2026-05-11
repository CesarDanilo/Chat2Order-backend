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
  findMany(userId: string): Promise<OrderWithItems[] | null>;
  create(data: CreateOrderInput): Promise<Order | null>;
}