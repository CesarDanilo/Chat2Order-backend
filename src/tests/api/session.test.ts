import jwt from "jsonwebtoken";
import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { Account, PASSWORD, bearer, createAccount } from "./support/helpers";

afterAll(async () => {
  await prisma.$disconnect();
});

const login = async (email: string, password = PASSWORD) =>
  (await request(app).post("/api/auth/login").send({ email, password }).expect(200)).body.token as string;

const getOrders = (token: string) =>
  request(app).get("/api/order").set("Authorization", `Bearer ${token}`);

describe("logout", () => {
  it("revoga só a sessão atual", async () => {
    const account = await createAccount();
    const otherSession = await login(account.email);

    await request(app).post("/api/auth/logout").set("Authorization", bearer(account)).expect(204);

    await getOrders(account.token).expect(401);
    await getOrders(otherSession).expect(200);
  });

  it("exige uma sessão válida", async () => {
    await request(app).post("/api/auth/logout").expect(401);
  });

  it("repetir o logout não muda nada", async () => {
    const account = await createAccount();

    await request(app).post("/api/auth/logout").set("Authorization", bearer(account)).expect(204);
    await request(app).post("/api/auth/logout").set("Authorization", bearer(account)).expect(401);
  });

  it("recusa corpo e query no logout", async () => {
    const account = await createAccount();

    await request(app)
      .post("/api/auth/logout?all=true")
      .set("Authorization", bearer(account))
      .expect(400);
  });
});

describe("troca de senha", () => {
  it("revoga todas as sessões da conta", async () => {
    const account = await createAccount();
    const otherSession = await login(account.email);

    await request(app)
      .put(`/api/user/${account.id}`)
      .set("Authorization", bearer(account))
      .send({ name: "Conta", email: account.email, password: "nova senha segura" })
      .expect(200);

    await getOrders(account.token).expect(401);
    await getOrders(otherSession).expect(401);

    const fresh = await login(account.email, "nova senha segura");
    await getOrders(fresh).expect(200);
  });

  it("feita pelo admin também revoga as sessões do usuário", async () => {
    const account = await createAccount();
    const admin = await createAccount(true);

    await request(app)
      .put(`/api/user/${account.id}`)
      .set("Authorization", bearer(admin))
      .send({ name: "Conta", email: account.email, password: "outra senha segura" })
      .expect(200);

    await getOrders(account.token).expect(401);
    await getOrders(admin.token).expect(200);
  });

  it("editar sem trocar a senha mantém as sessões", async () => {
    const account = await createAccount();

    await request(app)
      .put(`/api/user/${account.id}`)
      .set("Authorization", bearer(account))
      .send({ name: "Outro Nome", email: account.email })
      .expect(200);

    await getOrders(account.token).expect(200);
  });
});

describe("conteúdo do token", () => {
  it("tem identificador único e expira em até 1 dia", async () => {
    const account: Account = await createAccount();
    const payload = jwt.decode(account.token) as jwt.JwtPayload;

    expect(typeof payload.jti).toBe("string");
    expect(payload.exp! - payload.iat!).toBeLessThanOrEqual(24 * 60 * 60);
  });

  it("dois logins geram tokens diferentes", async () => {
    const account = await createAccount();
    const second = await login(account.email);

    expect(second).not.toBe(account.token);
  });
});
