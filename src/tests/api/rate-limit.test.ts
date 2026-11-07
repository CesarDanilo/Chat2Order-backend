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
import { Account, PASSWORD, bearer, createAccount } from "./support/helpers";

let heavy: Account;
let other: Account;

// Contas criadas antes: o teste de login bloqueia novos logins deste IP.
beforeAll(async () => {
  heavy = await createAccount();
  other = await createAccount();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("limites por rota", () => {
  it("cadastro bloqueia depois de 10 contas criadas, sem contar erros de formulário", async () => {
    const register = (email: string) =>
      request(app)
        .post("/api/user")
        .set("X-Forwarded-For", "203.0.113.7")
        .send({ name: "Cadastro", email, password: PASSWORD });

    await register("email-invalido").expect(400);

    for (let attempt = 0; attempt < 10; attempt++) {
      await register(`limite-${Date.now()}-${attempt}@test.local`).expect(201);
    }

    const blocked = await register(`limite-${Date.now()}-extra@test.local`).expect(429);
    expect(blocked.body.error.code).toBe("RATE_LIMITED");
  });

  it("login bloqueia depois de 10 tentativas erradas e aceita antes disso", async () => {
    const account = await createAccount();
    const wrong = () =>
      request(app)
        .post("/api/auth/login")
        .send({ email: account.email, password: "Senha-Errada-123" });

    for (let attempt = 0; attempt < 10; attempt++) {
      await wrong().expect(401);
    }

    const blocked = await wrong().expect(429);
    expect(typeof blocked.body.error.message).toBe("string");

    await request(app)
      .post("/api/auth/login")
      .send({ email: account.email, password: PASSWORD })
      .expect(429);
  });

  it("parse bloqueia depois de 20 chamadas por conta, sem atingir outra conta", async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: "{}" } }] });

    const call = (account = heavy) =>
      request(app)
        .post("/api/parse")
        .set("Authorization", bearer(account))
        .send({ message: "pedido" });

    for (let attempt = 0; attempt < 20; attempt++) {
      await call().expect(502);
    }

    await call().expect(429);
    await call(other).expect(502);
  });
});
