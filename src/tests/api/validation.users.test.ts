import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { Account, PASSWORD, bearer, createAccount, createOrder, expectValidationError } from "./support/helpers";

const newUser = (overrides: object = {}) => ({
  name: "Novo Usuário",
  email: `${randomUUID()}@test.local`,
  password: PASSWORD,
  ...overrides,
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/user", () => {
  it.each([
    ["nome curto", { name: "ab" }, "name"],
    ["nome longo", { name: "a".repeat(121) }, "name"],
    ["e-mail inválido", { email: "nao-e-email" }, "email"],
    ["senha curta", { password: "Ab1" }, "password"],
    ["senha acima de 72 bytes", { password: `A1${"x".repeat(71)}` }, "password"],
    ["tipo errado", { name: 123 }, "name"],
  ])("rejeita %s com 400", async (_label, overrides, field) => {
    const response = await request(app).post("/api/user").send(newUser(overrides)).expect(400);
    expectValidationError(response.body, field);
  });

  it.each(["name", "email", "password"])("rejeita corpo sem %s", async (field) => {
    const body: Record<string, unknown> = newUser();
    delete body[field];

    const response = await request(app).post("/api/user").send(body).expect(400);
    expectValidationError(response.body, field);
  });

  it("rejeita campos extras", async () => {
    const response = await request(app).post("/api/user").send(newUser({ admin: true })).expect(400);
    expectValidationError(response.body);
  });

  it("responde 409 para e-mail duplicado", async () => {
    const body = newUser();
    await request(app).post("/api/user").send(body).expect(201);

    const response = await request(app).post("/api/user").send(body).expect(409);
    expect(response.body.error.message).toMatch(/e-mail/i);
  });
});

describe("PUT /api/user/:id", () => {
  let user: Account;
  let admin: Account;
  let other: Account;

  beforeAll(async () => {
    user = await createAccount();
    admin = await createAccount(true);
    other = await createAccount();
  });

  it("aceita atualização sem senha", async () => {
    const response = await request(app)
      .put(`/api/user/${user.id}`)
      .set("Authorization", bearer(user))
      .send({ name: "Nome Novo", email: user.email })
      .expect(200);

    expect(response.body.name).toBe("Nome Novo");

    await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: PASSWORD })
      .expect(200);
  });

  it("rejeita senha fraca", async () => {
    const response = await request(app)
      .put(`/api/user/${user.id}`)
      .set("Authorization", bearer(user))
      .send({ name: "Nome Novo", email: user.email, password: "123" })
      .expect(400);

    expectValidationError(response.body, "password");
  });

  it("responde 409 para e-mail de outra conta", async () => {
    await request(app)
      .put(`/api/user/${user.id}`)
      .set("Authorization", bearer(user))
      .send({ name: "Nome Novo", email: other.email })
      .expect(409);
  });

  it("não-admin não altera o papel, nem o próprio", async () => {
    await request(app)
      .put(`/api/user/${user.id}`)
      .set("Authorization", bearer(user))
      .send({ name: "Nome Novo", email: user.email, admin: true })
      .expect(403);

    const stored = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stored?.admin).toBe(false);
  });

  it("admin promove outro usuário", async () => {
    const response = await request(app)
      .put(`/api/user/${other.id}`)
      .set("Authorization", bearer(admin))
      .send({ name: "Promovido", email: other.email, admin: true })
      .expect(200);

    expect(response.body.admin).toBe(true);
  });

  it("admin não remove o próprio acesso", async () => {
    await request(app)
      .put(`/api/user/${admin.id}`)
      .set("Authorization", bearer(admin))
      .send({ name: "Admin", email: admin.email, admin: false })
      .expect(400);
  });

  it("responde 404 para usuário inexistente", async () => {
    await request(app)
      .put(`/api/user/${randomUUID()}`)
      .set("Authorization", bearer(admin))
      .send({ name: "Ninguém", email: `${randomUUID()}@test.local` })
      .expect(404);
  });
});

describe("DELETE /api/user/:id", () => {
  it("responde 409 quando o usuário tem pedidos", async () => {
    const owner = await createAccount();
    await createOrder(owner);

    const response = await request(app)
      .delete(`/api/user/${owner.id}`)
      .set("Authorization", bearer(owner))
      .expect(409);

    expect(typeof response.body.error.message).toBe("string");
  });

  it("responde 404 para usuário inexistente", async () => {
    const admin = await createAccount(true);

    await request(app)
      .delete(`/api/user/${randomUUID()}`)
      .set("Authorization", bearer(admin))
      .expect(404);
  });
});

describe("POST /api/auth/login", () => {
  it.each([
    ["sem e-mail", { password: PASSWORD }, "email"],
    ["sem senha", { email: "a@test.local" }, "password"],
    ["senha enorme", { email: "a@test.local", password: "x".repeat(300) }, "password"],
    ["tipo errado", { email: { contains: "@" }, password: PASSWORD }, "email"],
  ])("rejeita %s com 400", async (_label, body, field) => {
    const response = await request(app).post("/api/auth/login").send(body).expect(400);
    expectValidationError(response.body, field);
  });

  it("rejeita campos extras", async () => {
    await request(app)
      .post("/api/auth/login")
      .send({ email: "a@test.local", password: PASSWORD, admin: true })
      .expect(400);
  });

  it("mantém 401 genérico para credencial errada", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "ninguem@test.local", password: PASSWORD })
      .expect(401);

    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("params e query", () => {
  it("rejeita id que não é UUID", async () => {
    const admin = await createAccount(true);

    const response = await request(app)
      .get("/api/user/nao-e-uuid")
      .set("Authorization", bearer(admin))
      .expect(400);

    expectValidationError(response.body, "id");
  });

  it("rejeita query desconhecida", async () => {
    const admin = await createAccount(true);

    await request(app)
      .get("/api/user?filtro=x")
      .set("Authorization", bearer(admin))
      .expect(400);
  });
});

describe("erros de corpo da requisição", () => {
  it("JSON malformado responde 400 em JSON, sem stack", async () => {
    const response = await request(app)
      .post("/api/user")
      .set("Content-Type", "application/json")
      .send("{quebrado")
      .expect(400);

    expect(response.type).toBe("application/json");
    expect(JSON.stringify(response.body)).not.toMatch(/node_modules|SyntaxError/);
  });

  it("corpo acima do limite responde 413 em JSON", async () => {
    const response = await request(app)
      .post("/api/user")
      .send({ name: "x".repeat(300 * 1024) })
      .expect(413);

    expect(response.type).toBe("application/json");
    expect(typeof response.body.error.message).toBe("string");
  });
});
