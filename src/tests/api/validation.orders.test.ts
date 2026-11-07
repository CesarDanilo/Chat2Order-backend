import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../app/app";
import { prisma } from "../../shared/database/prisma";
import {
  Account,
  bearer,
  createAccount,
  createOrder,
  createProduct,
  expectValidationError,
  orderBody,
} from "./support/helpers";

const item = { productName: "Pizza", quantity: 2, unitPrice: 10 };

let owner: Account;
let stranger: Account;

beforeAll(async () => {
  owner = await createAccount();
  stranger = await createAccount();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const post = (body: object) =>
  request(app).post("/api/order").set("Authorization", bearer(owner)).send(body);

describe("POST /api/order", () => {
  it.each([
    ["nome vazio", { customerName: "   " }, "customerName"],
    ["nome longo", { customerName: "a".repeat(121) }, "customerName"],
    ["telefone curto", { customerPhone: "123" }, "customerPhone"],
    ["telefone com letras", { customerPhone: "abcdefghij" }, "customerPhone"],
    ["endereço vazio", { address: "" }, "address"],
    ["pagamento inválido", { paymentMethod: "BOLETO" }, "paymentMethod"],
    ["status inválido", { status: "XPTO" }, "status"],
    ["origem inválida", { source: "TELEGRAM" }, "source"],
    ["sem itens", { items: [] }, "items"],
    ["texto bruto gigante", { rawMessage: "a".repeat(50001) }, "rawMessage"],
    ["total negativo", { total: -100 }, "total"],
  ])("rejeita %s com 400", async (_label, overrides, field) => {
    const response = await post(orderBody(overrides)).expect(400);
    expectValidationError(response.body, field);
  });

  it.each([
    ["quantidade zero", { ...item, quantity: 0 }, "items.0.quantity"],
    ["quantidade negativa", { ...item, quantity: -1 }, "items.0.quantity"],
    ["quantidade fracionada", { ...item, quantity: 1.5 }, "items.0.quantity"],
    ["preço negativo", { ...item, unitPrice: -5 }, "items.0.unitPrice"],
    ["preço com 3 casas", { ...item, unitPrice: 1.234 }, "items.0.unitPrice"],
    ["produto sem nome", { ...item, productName: "" }, "items.0.productName"],
    ["productId inválido", { ...item, productId: "abc" }, "items.0.productId"],
    ["campo extra no item", { ...item, order: { connect: { id: "x" } } }, "items.0.order"],
  ])("rejeita item com %s", async (_label, badItem, field) => {
    const response = await post(orderBody({ items: [badItem] })).expect(400);
    expectValidationError(response.body, field);
  });

  it("rejeita mais de 100 itens", async () => {
    const response = await post(orderBody({ items: Array(101).fill(item) })).expect(400);
    expectValidationError(response.body, "items");
  });

  it("rejeita campos extras, como o dono", async () => {
    const response = await post(orderBody({ userId: stranger.id })).expect(400);
    expectValidationError(response.body);
  });

  it("recalcula totais no servidor e ignora os do cliente", async () => {
    const response = await post(
      orderBody({
        total: 999,
        items: [
          { productName: "A", quantity: 3, unitPrice: 19.9, totalPrice: 1 },
          { productName: "B", quantity: 1, unitPrice: 0.1 },
        ],
      }),
    ).expect(200);

    expect(response.body.total).toBe(59.8);

    const items = await prisma.orderItem.findMany({
      where: { orderId: response.body.id },
      orderBy: { productName: "asc" },
    });
    expect(items.map((stored) => Number(stored.totalPrice))).toEqual([59.7, 0.1]);
  });

  it("aceita produto da própria conta", async () => {
    const product = await createProduct(owner);

    const response = await post(
      orderBody({ items: [{ ...item, productId: product.id }] }),
    ).expect(200);

    const [stored] = await prisma.orderItem.findMany({ where: { orderId: response.body.id } });
    expect(stored.productId).toBe(product.id);
  });

  it("rejeita produto de outra conta", async () => {
    const product = await createProduct(stranger);

    const response = await post(
      orderBody({ items: [{ ...item, productId: product.id }] }),
    ).expect(400);

    expect(JSON.stringify(response.body)).not.toContain(stranger.id);
  });
});

describe("PUT /api/order/:id", () => {
  const put = (id: string, body: object) =>
    request(app).put(`/api/order/${id}`).set("Authorization", bearer(owner)).send(body);

  it("rejeita corpo sem itens e mantém os itens gravados", async () => {
    const order = await createOrder(owner);

    await put(order.id, { status: "CONCLUIDO" }).expect(400);

    const stored = await prisma.orderItem.count({ where: { orderId: order.id } });
    expect(stored).toBe(1);
  });

  it("recalcula o total ao atualizar", async () => {
    const order = await createOrder(owner);

    const response = await put(
      order.id,
      orderBody({ total: 1, items: [{ ...item, quantity: 4 }] }),
    ).expect(200);

    expect(response.body.total).toBe(40);
  });

  it("rejeita produto de outra conta", async () => {
    const order = await createOrder(owner);
    const product = await createProduct(stranger);

    await put(order.id, orderBody({ items: [{ ...item, productId: product.id }] })).expect(400);
  });
});

describe("DELETE /api/order/:id", () => {
  it("exclui pedido que tem histórico de status", async () => {
    const order = await createOrder(owner);
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "PENDENTE" },
    });

    await request(app)
      .delete(`/api/order/${order.id}`)
      .set("Authorization", bearer(owner))
      .expect(200);
  });

  it("outra conta não apaga o histórico do pedido", async () => {
    const order = await createOrder(owner);
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: "PENDENTE" },
    });

    await request(app)
      .delete(`/api/order/${order.id}`)
      .set("Authorization", bearer(stranger))
      .expect(404);

    const history = await prisma.orderStatusHistory.count({ where: { orderId: order.id } });
    expect(history).toBe(2);
  });
});

describe("params", () => {
  it("rejeita id que não é UUID", async () => {
    const response = await request(app)
      .get("/api/order/nao-e-uuid")
      .set("Authorization", bearer(owner))
      .expect(400);

    expectValidationError(response.body, "id");
  });

  it("id válido inexistente responde 404", async () => {
    await request(app)
      .get(`/api/order/${randomUUID()}`)
      .set("Authorization", bearer(owner))
      .expect(404);
  });
});

describe("erros do banco não vazam", () => {
  it("o corpo de erro não traz detalhes internos", async () => {
    const response = await post({}).expect(400);
    expectValidationError(response.body);
  });
});
