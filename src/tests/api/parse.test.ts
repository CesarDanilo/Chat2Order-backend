const mockCreate = jest.fn();

jest.mock("groq-sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  })),
}));

import request from "supertest";
import app from "../../app/app";
import { prisma } from "../../shared/database/prisma";
import { Account, bearer, createAccount, expectValidationError } from "./support/helpers";

const aiReturns = (content: string) =>
  mockCreate.mockResolvedValueOnce({ choices: [{ message: { content } }] });

const validAnswer = {
  customerName: "Maria",
  customerPhone: "(11) 91234-5678",
  address: "Rua A, 10",
  paymentMethod: "Cartão de crédito",
  items: [{ productName: "Pizza", quantity: 2, unitPrice: 30, totalPrice: 1 }],
  total: 1,
};

let owner: Account;

beforeEach(async () => {
  owner = await createAccount();
});

beforeEach(() => {
  mockCreate.mockReset();
});

afterAll(async () => {
  await prisma.$disconnect();
});

let messageCount = 0;

// Mensagens iguais em poucos minutos contam como a mesma importação.
const uniqueMessage = () => `pedido número ${++messageCount}`;

const parse = (body: object, account = owner) =>
  request(app).post("/api/parse").set("Authorization", bearer(account)).send(body);

const orderCount = () => prisma.order.count({ where: { userId: owner.id } });

describe("POST /api/parse: entrada", () => {
  it("exige token", async () => {
    await request(app).post("/api/parse").send({ message: "oi" }).expect(401);
  });

  it.each([
    ["sem mensagem", {}],
    ["mensagem vazia", { message: "   " }],
    ["mensagem longa", { message: "a".repeat(50001) }],
    ["tipo errado", { message: 123 }],
  ])("rejeita %s sem chamar a IA", async (_label, body) => {
    const response = await parse(body).expect(400);

    expectValidationError(response.body, "message");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("rejeita campos extras", async () => {
    await parse({ message: "oi", userId: "x" }).expect(400);
  });
});

describe("POST /api/parse: saída da IA", () => {
  it("grava o pedido com totais recalculados e pagamento normalizado", async () => {
    aiReturns(JSON.stringify(validAnswer));

    const response = await parse({ message: uniqueMessage() }).expect(200);

    expect(response.body.total).toBe(60);
    expect(response.body.items[0].totalPrice).toBe(60);
    expect(response.body.paymentMethod).toBe("CREDIT_CARD");
    expect(response.body.status).toBe("PENDENTE");
    expect(response.body.source).toBe("WHATSAPP");
  });

  it("usa valores padrão quando faltam dados do cliente", async () => {
    aiReturns(JSON.stringify({ items: validAnswer.items, customerPhone: "N/A" }));

    const response = await parse({ message: uniqueMessage() }).expect(200);

    expect(response.body.customerName).toBe("sem nome");
    expect(response.body.customerPhone).toBe("00000000000");
    expect(response.body.paymentMethod).toBe("PIX");
  });

  it("ignora campos que a IA tenta incluir no pedido", async () => {
    aiReturns(
      JSON.stringify({
        ...validAnswer,
        userId: "outra-conta",
        status: "CONCLUIDO",
        items: [{ ...validAnswer.items[0], orderId: "x", productId: "y", id: "z" }],
      }),
    );

    const response = await parse({ message: uniqueMessage() }).expect(200);

    expect(response.body.userId).toBe(owner.id);
    expect(response.body.status).toBe("PENDENTE");
    expect(response.body.items[0].productId).toBeNull();
  });

  it.each([
    ["JSON inválido", "isto não é json"],
    ["sem itens", JSON.stringify({ ...validAnswer, items: [] })],
    ["quantidade negativa", JSON.stringify({ ...validAnswer, items: [{ productName: "x", quantity: -1, unitPrice: 1 }] })],
    ["preço como texto", JSON.stringify({ ...validAnswer, items: [{ productName: "x", quantity: 1, unitPrice: "caro" }] })],
    ["lista no lugar do objeto", "[]"],
  ])("não grava pedido quando a resposta tem %s", async (_label, content) => {
    const before = await orderCount();
    aiReturns(content);

    const response = await parse({ message: uniqueMessage() }).expect(502);

    expect(typeof response.body.error.message).toBe("string");
    expect(JSON.stringify(response.body)).not.toContain(content.slice(0, 20));
    expect(await orderCount()).toBe(before);
  });

  it("responde 503 quando a IA está sobrecarregada", async () => {
    mockCreate.mockRejectedValueOnce(Object.assign(new Error("over capacity"), { status: 503 }));

    const response = await parse({ message: uniqueMessage() }).expect(503);
    expect(response.body.error.message).not.toContain("over capacity");
  });

  it("não expõe erro do provedor", async () => {
    mockCreate.mockRejectedValueOnce(Object.assign(new Error("Invalid API Key sk-123"), { status: 401 }));

    const response = await parse({ message: uniqueMessage() }).expect(502);
    expect(JSON.stringify(response.body)).not.toContain("API Key");
  });
});

describe("POST /api/parse: normalização", () => {
  it("normaliza o telefone informado pela IA", async () => {
    aiReturns(JSON.stringify(validAnswer));

    const response = await parse({ message: uniqueMessage() }).expect(200);

    expect(response.body.customerPhone).toBe("11912345678");
  });

  it("usa o marcador quando o telefone da IA é inválido", async () => {
    aiReturns(JSON.stringify({ ...validAnswer, customerPhone: "(00) 1234" }));

    const response = await parse({ message: uniqueMessage() }).expect(200);

    expect(response.body.customerPhone).toBe("00000000000");
  });

  it("remove caracteres de controle da conversa, sem recusar", async () => {
    aiReturns(JSON.stringify(validAnswer));
    const text = uniqueMessage();

    const response = await parse({ message: `${text}\u0000\u0007\nlinha 2` }).expect(200);

    expect(response.body.rawMessage).toBe(`${text}\nlinha 2`);
  });

  it("remove caracteres de controle dos dados da IA", async () => {
    aiReturns(
      JSON.stringify({
        ...validAnswer,
        customerName: "Maria\u0000 Lima",
        items: [{ productName: "Pizza\u0007", quantity: 1, unitPrice: 10 }],
      }),
    );

    const response = await parse({ message: uniqueMessage() }).expect(200);

    expect(response.body.customerName).toBe("Maria Lima");
    expect(response.body.items[0].productName).toBe("Pizza");
  });

  it("arredonda preço com mais de 2 casas", async () => {
    aiReturns(
      JSON.stringify({
        ...validAnswer,
        items: [{ productName: "Pizza", quantity: 1, unitPrice: 12.345 }],
      }),
    );

    const response = await parse({ message: uniqueMessage() }).expect(200);

    expect(response.body.items[0].unitPrice).toBe(12.35);
  });

  it("registra o status inicial no histórico", async () => {
    aiReturns(JSON.stringify(validAnswer));

    const response = await parse({ message: uniqueMessage() }).expect(200);

    const history = await prisma.orderStatusHistory.findMany({ where: { orderId: response.body.id } });
    expect(history.map((row) => row.status)).toEqual(["PENDENTE"]);
  });
});

describe("POST /api/parse: importação repetida", () => {
  it("devolve o mesmo pedido, sem chamar a IA de novo", async () => {
    aiReturns(JSON.stringify(validAnswer));
    const message = uniqueMessage();

    const first = await parse({ message }).expect(200);
    const second = await parse({ message }).expect(200);

    expect(second.body.id).toBe(first.body.id);
    expect(second.body.items).toHaveLength(1);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("não reaproveita pedido de outra conta", async () => {
    const other = await createAccount();
    const message = uniqueMessage();

    aiReturns(JSON.stringify(validAnswer));
    const first = await parse({ message }).expect(200);

    aiReturns(JSON.stringify(validAnswer));
    const second = await parse({ message }, other).expect(200);

    expect(second.body.id).not.toBe(first.body.id);
  });

  it("depois da janela de tempo cria um novo pedido", async () => {
    aiReturns(JSON.stringify(validAnswer));
    const message = uniqueMessage();
    const first = await parse({ message }).expect(200);

    await prisma.order.update({
      where: { id: first.body.id },
      data: { createdAt: new Date(Date.now() - 11 * 60 * 1000) },
    });

    aiReturns(JSON.stringify(validAnswer));
    const second = await parse({ message }).expect(200);

    expect(second.body.id).not.toBe(first.body.id);
  });
});
