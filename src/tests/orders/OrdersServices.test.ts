import { FakeOrdersRepository } from "../../repository/FakeOrdersRepository";
import { OrderService } from "../../services/order.service";

describe("Order services", () => {
  const data = {
    userId: "85c34136-9fcd-42b6-aa8e-771df7a0ffd9",
    customerName: "Cesar Rodrigues",
    customerPhone: "67991619198",
    address: "Rua dos Apeninos, 390, Jardim Itália",
    paymentMethod: "Pix",
    status: "pending",
    source: "whatsapp",
    total: 120.0,
    items: [
      {
        productName: "Pizza Grande de Calabresa",
        quantity: 2,
        unitPrice: 45.0,
        totalPrice: 90.0,
      },
      {
        productName: "Coca-Cola 2L",
        quantity: 1,
        unitPrice: 30.0,
        totalPrice: 30.0,
      },
    ],
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

    // garante que foi criado
    expect(createdOrder).not.toBeNull();

    if (!createdOrder) return;

    await orderService.DeleteOrder(createdOrder.id);

    const deletedOrder = await orderService.GetOrderById(createdOrder.id);

    // Como seu método retorna array:
    expect(deletedOrder).toHaveLength(0);
  });
});