import request from "supertest";
import app from "../../app/app";
import { prisma } from "../../shared/database/prisma";
import { Account, bearer, createAccount, createOrder, expectValidationError, orderBody } from "./support/helpers";

let owner: Account;

beforeAll(async () => {
  owner = await createAccount();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const post = (body: object) =>
  request(app).post("/api/order").set("Authorization", bearer(owner)).send(body);

const put = (id: string, body: object) =>
  request(app).put(`/api/order/${id}`).set("Authorization", bearer(owner)).send(body);

const orderIn = async (status: string) => {
  const order = await createOrder(owner);
  if (status === "PENDENTE") return order;

  await put(order.id, orderBody({ status })).expect(200);
  return order;
};

const historyOf = async (orderId: string) => {
  const rows = await prisma.orderStatusHistory.findMany({
    where: { orderId },
    orderBy: { changedAt: "asc" },
  });

  return rows.map((row) => row.status);
};

describe("transições de status", () => {
  it.each([
    ["PENDENTE", "CONCLUIDO"],
    ["PENDENTE", "CANCELADO"],
    ["CONCLUIDO", "CANCELADO"],
    ["PENDENTE", "PENDENTE"],
    ["CONCLUIDO", "CONCLUIDO"],
    ["CANCELADO", "CANCELADO"],
  ])("permite %s para %s", async (from, to) => {
    const order = await orderIn(from);

    const response = await put(order.id, orderBody({ status: to })).expect(200);

    expect(response.body.status).toBe(to);
  });

  it.each([
    ["CONCLUIDO", "PENDENTE"],
    ["CANCELADO", "PENDENTE"],
    ["CANCELADO", "CONCLUIDO"],
  ])("recusa %s para %s com 409 e não altera nada", async (from, to) => {
    const order = await orderIn(from);

    const response = await put(
      order.id,
      orderBody({ status: to, customerName: "Não Deve Gravar" }),
    ).expect(409);

    expect(response.body.error.code).toBe("INVALID_STATE_TRANSITION");

    const stored = await prisma.order.findUnique({ where: { id: order.id } });
    expect(stored?.status).toBe(from);
    expect(stored?.customerName).toBe("Cliente Original");
  });

  it("repetir a mesma requisição é idempotente", async () => {
    const order = await createOrder(owner);
    const body = orderBody({ status: "CONCLUIDO" });

    await put(order.id, body).expect(200);
    await put(order.id, body).expect(200);

    expect(await historyOf(order.id)).toEqual(["PENDENTE", "CONCLUIDO"]);
  });

  it("requisições simultâneas não duplicam o histórico", async () => {
    const order = await createOrder(owner);
    const body = orderBody({ status: "CONCLUIDO" });

    const results = await Promise.all([put(order.id, body), put(order.id, body)]);

    for (const result of results) {
      expect([200, 409]).toContain(result.status);
    }

    expect(await historyOf(order.id)).toEqual(["PENDENTE", "CONCLUIDO"]);
  });
});

describe("status inicial", () => {
  it.each(["PENDENTE", "CONCLUIDO"])("permite criar como %s", async (status) => {
    const response = await post(orderBody({ status })).expect(200);
    expect(response.body.status).toBe(status);
  });

  it("recusa criar pedido já cancelado", async () => {
    const response = await post(orderBody({ status: "CANCELADO" })).expect(400);
    expect(response.body.error.code).toBe("INVALID_STATE_TRANSITION");
  });
});

describe("histórico de status", () => {
  it("registra a criação e cada mudança", async () => {
    const order = await createOrder(owner);

    await put(order.id, orderBody({ status: "CONCLUIDO" })).expect(200);
    await put(order.id, orderBody({ status: "CANCELADO" })).expect(200);

    expect(await historyOf(order.id)).toEqual(["PENDENTE", "CONCLUIDO", "CANCELADO"]);
  });

  it("editar sem mudar o status não gera registro", async () => {
    const order = await createOrder(owner);

    await put(order.id, orderBody({ customerName: "Outro Nome" })).expect(200);

    expect(await historyOf(order.id)).toEqual(["PENDENTE"]);
  });
});

describe("telefone", () => {
  it.each([
    ["celular com máscara", "(11) 91234-5678", "11912345678"],
    ["celular só com dígitos", "11912345678", "11912345678"],
    ["fixo", "(11) 3456-7890", "1134567890"],
    ["com código do Brasil", "+55 11 91234-5678", "11912345678"],
    ["com 55 sem o sinal", "5511912345678", "11912345678"],
    ["internacional", "+1 415 555 2671", "+14155552671"],
  ])("normaliza %s", async (_label, customerPhone, expected) => {
    const response = await post(orderBody({ customerPhone })).expect(200);
    expect(response.body.customerPhone).toBe(expected);
  });

  it.each([
    ["DDD inexistente", "(00) 91234-5678"],
    ["DDD iniciado por zero", "(01) 91234-5678"],
    ["celular sem o 9", "(11) 81234-56789"],
    ["curto demais", "1234567"],
    ["só símbolos", "((((((((()))"],
    ["com letras", "11 9abc1-2345"],
    ["internacional curto", "+1234"],
    ["internacional longo", "+1234567890123456"],
  ])("recusa %s", async (_label, customerPhone) => {
    const response = await post(orderBody({ customerPhone })).expect(400);
    expectValidationError(response.body, "customerPhone");
  });

  it("aceita o marcador de telefone ausente, usado em pedidos da IA", async () => {
    const response = await post(orderBody({ customerPhone: "00000000000" })).expect(200);
    expect(response.body.customerPhone).toBe("00000000000");
  });
});

describe("textos do pedido", () => {
  it.each([
    ["cliente só com espaços", { customerName: "    " }, "customerName"],
    ["cliente com quebra de linha", { customerName: "Ana\nLima" }, "customerName"],
    ["cliente com caractere nulo", { customerName: "Ana\u0000" }, "customerName"],
    ["endereço só com espaços", { address: "   " }, "address"],
    ["endereço com caractere nulo", { address: "Rua\u0000" }, "address"],
    ["mensagem com caractere nulo", { rawMessage: "oi\u0000" }, "rawMessage"],
  ])("recusa %s", async (_label, overrides, field) => {
    const response = await post(orderBody(overrides)).expect(400);
    expectValidationError(response.body, field);
  });

  it("recusa item com quebra de linha no nome", async () => {
    const response = await post(
      orderBody({ items: [{ productName: "A\nB", quantity: 1, unitPrice: 1 }] }),
    ).expect(400);

    expectValidationError(response.body, "items.0.productName");
  });

  it("endereço e mensagem aceitam várias linhas", async () => {
    const response = await post(
      orderBody({ address: "Rua A, 1\nBloco B", rawMessage: "Olá\nQuero pizza" }),
    ).expect(200);

    expect(response.body.address).toBe("Rua A, 1\nBloco B");
  });

  it("nome aceita acentos, apóstrofo e emoji", async () => {
    const response = await post(orderBody({ customerName: "D'Ávila 🍕" })).expect(200);
    expect(response.body.customerName).toBe("D'Ávila 🍕");
  });
});

describe("valores do pedido", () => {
  it("devolve dinheiro como número", async () => {
    const response = await post(
      orderBody({ items: [{ productName: "A", quantity: 3, unitPrice: 19.9 }] }),
    ).expect(200);

    expect(response.body.total).toBe(59.7);
    expect(response.body.items[0].unitPrice).toBe(19.9);
    expect(response.body.items[0].totalPrice).toBe(59.7);
  });

  it("guarda o total com precisão exata no banco", async () => {
    const response = await post(
      orderBody({ items: [{ productName: "A", quantity: 3, unitPrice: 0.1 }] }),
    ).expect(200);

    const [row] = await prisma.$queryRaw<{ total: string }[]>`
      SELECT total::text FROM "Order" WHERE id = ${response.body.id}
    `;

    expect(row.total).toBe("0.30");
  });

  it("recusa pedido acima do valor máximo", async () => {
    const response = await post(
      orderBody({
        items: Array(100).fill({ productName: "A", quantity: 10000, unitPrice: 1000000 }),
      }),
    ).expect(400);

    expectValidationError(response.body, "items");
  });
});

describe("paginação de pedidos", () => {
  const list = (account: Account, query = "") =>
    request(app).get(`/api/order${query}`).set("Authorization", bearer(account));

  it("limita a página e informa o total", async () => {
    const paged = await createAccount();

    for (let index = 0; index < 3; index++) await createOrder(paged);

    const response = await list(paged, "?limit=2").expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.headers["x-total-count"]).toBe("3");
  });

  it("sem parâmetros continua devolvendo a lista com os itens", async () => {
    const paged = await createAccount();
    await createOrder(paged);

    const response = await list(paged).expect(200);

    expect(response.body[0].items).toHaveLength(1);
  });

  it.each(["?limit=0", "?limit=501", "?page=0", "?sort=total", "?status=PENDENTE"])(
    "recusa %s",
    async (query) => {
      await list(owner, query).expect(400);
    },
  );
});
