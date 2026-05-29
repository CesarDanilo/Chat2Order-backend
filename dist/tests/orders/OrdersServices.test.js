"use strict";

// src/repository/FakeOrdersRepository.ts
var import_node_crypto = require("crypto");
var FakeOrdersRepository = class {
  constructor() {
    this.orders = [];
  }
  async create(data) {
    const newOrder = {
      id: (0, import_node_crypto.randomUUID)(),
      userId: data.userId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      address: data.address,
      paymentMethod: data.paymentMethod,
      status: data.status,
      total: data.total,
      source: data.source,
      rawMessage: null,
      createdAt: /* @__PURE__ */ new Date()
    };
    const orderWithItems = {
      ...newOrder,
      items: data.items.map((item) => ({
        id: (0, import_node_crypto.randomUUID)(),
        orderId: newOrder.id,
        ...item
      }))
    };
    this.orders.push(orderWithItems);
    return newOrder;
  }
  async findMany(userId) {
    const userOrders = this.orders.filter((o) => o.userId === userId);
    return userOrders.length > 0 ? userOrders : [];
  }
  async delete(id) {
    const index = this.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;
    const deleted = this.orders[index];
    this.orders.splice(index, 1);
    return deleted;
  }
};

// src/services/order.service.ts
var OrderService = class {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }
  async GetOrderByUserId(userId) {
    return await this.orderRepository.findManyByUserId(userId);
  }
  async GetOrderById(orderId) {
    return await this.orderRepository.findById(orderId);
  }
  async CreateOrder(data, userId) {
    data.userId = userId;
    return await this.orderRepository.create(data);
  }
  async UpdateOrder(orderId, data) {
    return await this.orderRepository.update(orderId, data);
  }
  async DeleteOrder(id) {
    return await this.orderRepository.delete(id);
  }
};

// src/tests/orders/OrdersServices.test.ts
describe("Order services", () => {
  const data = {
    userId: "85c34136-9fcd-42b6-aa8e-771df7a0ffd9",
    customerName: "Cesar Rodrigues",
    customerPhone: "67991619198",
    address: "Rua dos Apeninos, 390, Jardim It\xE1lia",
    paymentMethod: "Pix",
    status: "pending",
    source: "whatsapp",
    total: 120,
    items: [
      {
        productName: "Pizza Grande de Calabresa",
        quantity: 2,
        unitPrice: 45,
        totalPrice: 90
      },
      {
        productName: "Coca-Cola 2L",
        quantity: 1,
        unitPrice: 30,
        totalPrice: 30
      }
    ]
  };
  it("should be able to create an order", async () => {
    const ordersRepository = new FakeOrdersRepository();
    const orderService = new OrderService(ordersRepository);
    const order = await orderService.CreateOrder(
      data,
      "85c34136-9fcd-42b6-aa8e-771df7a0ffd9"
    );
    expect(order).toHaveProperty("id");
    expect(order?.customerName).toBe("Cesar Rodrigues");
    expect(order?.total).toBe(120);
    expect(order?.status).toBe("pending");
  });
  it("should delete an order", async () => {
    const ordersRepository = new FakeOrdersRepository();
    const orderService = new OrderService(ordersRepository);
    const createdOrder = await orderService.CreateOrder(
      data,
      "85c34136-9fcd-42b6-aa8e-771df7a0ffd9"
    );
    expect(createdOrder).not.toBeNull();
    if (!createdOrder) return;
    await orderService.DeleteOrder(createdOrder.id);
    const deletedOrder = await orderService.GetOrderById(createdOrder.id);
    expect(deletedOrder).toHaveLength(0);
  });
});
