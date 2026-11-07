import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { Account, PASSWORD, createAccount } from "./support/helpers";

const secret = () => process.env.JWT_SECRET as string;

let user: Account;

beforeAll(async () => {
  user = await createAccount();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const getOrders = (authorization?: string) => {
  const call = request(app).get("/api/order");
  return authorization ? call.set("Authorization", authorization) : call;
};

const expectUnauthorized = async (authorization?: string) => {
  const response = await getOrders(authorization).expect(401);
  expect(response.body.error.code).toBe("UNAUTHORIZED");
  expect(typeof response.body.error.message).toBe("string");
};

describe("validação do token", () => {
  it("aceita token válido", async () => {
    await getOrders(`Bearer ${user.token}`).expect(200);
  });

  it("recusa ausência de token", async () => {
    await expectUnauthorized();
  });

  it("recusa esquema diferente de Bearer", async () => {
    await expectUnauthorized(`Basic ${user.token}`);
  });

  it("recusa Bearer sem token", async () => {
    await expectUnauthorized("Bearer ");
  });

  it("recusa token adulterado", async () => {
    await expectUnauthorized(`Bearer ${user.token}x`);
  });

  it("recusa token assinado com outro segredo", async () => {
    await expectUnauthorized(`Bearer ${jwt.sign({ sub: user.id }, "outro-segredo")}`);
  });

  it("recusa token expirado", async () => {
    const expired = jwt.sign({ sub: user.id }, secret(), { expiresIn: -10 });
    await expectUnauthorized(`Bearer ${expired}`);
  });

  it("recusa token sem assinatura (alg none)", async () => {
    const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const unsigned = `${encode({ alg: "none", typ: "JWT" })}.${encode({ sub: user.id })}.`;

    await expectUnauthorized(`Bearer ${unsigned}`);
  });

  it("recusa outro algoritmo de assinatura", async () => {
    const hs512 = jwt.sign({ sub: user.id }, secret(), { algorithm: "HS512" });
    await expectUnauthorized(`Bearer ${hs512}`);
  });

  it("recusa token sem sub", async () => {
    await expectUnauthorized(`Bearer ${jwt.sign({ id: user.id }, secret())}`);
  });

  it("recusa token enorme", async () => {
    await expectUnauthorized(`Bearer ${"a".repeat(5000)}`);
  });

  it("recusa token de conta excluída", async () => {
    const removed = await createAccount();
    await prisma.user.delete({ where: { id: removed.id } });

    await expectUnauthorized(`Bearer ${removed.token}`);
  });

  it("recusa token de usuário inexistente", async () => {
    await expectUnauthorized(`Bearer ${jwt.sign({ sub: randomUUID() }, secret())}`);
  });
});

describe("login", () => {
  it("credencial errada responde o mesmo para conta existente e inexistente", async () => {
    const wrongPassword = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "Senha-Errada-123" })
      .expect(401);

    const unknownEmail = await request(app)
      .post("/api/auth/login")
      .send({ email: "ninguem@test.local", password: "Senha-Errada-123" })
      .expect(401);

    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("aceita e-mail com maiúsculas e espaços em volta", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ email: `  ${user.email.toUpperCase()}  `, password: PASSWORD })
      .expect(200);
  });

  it("aceita conta antiga com e-mail em maiúsculas", async () => {
    const legacy = await createAccount();
    const mixedCase = `Legado-${legacy.email}`.replace("legado", "LEGADO");
    await prisma.user.update({ where: { id: legacy.id }, data: { email: mixedCase } });

    await request(app)
      .post("/api/auth/login")
      .send({ email: mixedCase.toLowerCase(), password: PASSWORD })
      .expect(200);
  });
});
