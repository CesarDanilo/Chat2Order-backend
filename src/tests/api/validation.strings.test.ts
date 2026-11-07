import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../app/app";
import { prisma } from "../../shared/database/prisma";
import { Account, PASSWORD, bearer, createAccount, expectValidationError } from "./support/helpers";

const newUser = (overrides: object = {}) => ({
  name: "Novo Usuário",
  email: `${randomUUID()}@test.local`,
  password: PASSWORD,
  ...overrides,
});

// Cada chamada vem de um IP diferente: o limite de cadastro tem teste próprio.
let nextIp = 0;
const createUser = (body: object) =>
  request(app)
    .post("/api/user")
    .set("X-Forwarded-For", `10.0.${Math.floor(++nextIp / 250)}.${nextIp % 250}`)
    .send(body);

let owner: Account;
let admin: Account;

beforeAll(async () => {
  owner = await createAccount();
  admin = await createAccount(true);
});

afterAll(async () => {
  await prisma.$disconnect();
});

const postProduct = (body: object) =>
  request(app).post("/api/product").set("Authorization", bearer(owner)).send(body);

describe("formato padrão de erro", () => {
  it("usa error.code, error.message e error.details", async () => {
    const response = await createUser(newUser({ email: "invalido" })).expect(400);

    expect(response.body).toEqual({
      error: {
        code: "VALIDATION_ERROR",
        message: "Existem campos inválidos.",
        details: [{ field: "email", code: "INVALID_FORMAT", message: "E-mail inválido" }],
      },
    });
  });

  it.each([
    ["campo ausente", { name: undefined }, "name", "REQUIRED"],
    ["tipo errado", { name: 123 }, "name", "INVALID_TYPE"],
    ["null em obrigatório", { name: null }, "name", "INVALID_TYPE"],
    ["texto curto", { name: "ab" }, "name", "MIN_LENGTH"],
    ["texto longo", { name: "a".repeat(121) }, "name", "MAX_LENGTH"],
    ["campo desconhecido", { admin: true }, "admin", "UNKNOWN_FIELD"],
  ])("%s gera o código certo", async (_label, overrides, field, code) => {
    const response = await createUser(newUser(overrides)).expect(400);
    const detail = response.body.error.details.find((item: any) => item.field === field);

    expect(detail?.code).toBe(code);
  });

  it("erro de negócio não traz details", async () => {
    const body = newUser();
    await createUser(body).expect(201);

    const response = await createUser(body).expect(409);

    expect(response.body).toEqual({
      error: { code: "EMAIL_TAKEN", message: expect.any(String) },
    });
  });

  it("corpo que não é objeto é recusado", async () => {
    const response = await request(app)
      .post("/api/user")
      .set("Content-Type", "application/json")
      .send("[1,2,3]")
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("__proto__ no corpo é recusado", async () => {
    const response = await request(app)
      .post("/api/user")
      .set("Content-Type", "application/json")
      .send(`{"name":"Nome Ok","email":"p@test.local","password":"${PASSWORD}","__proto__":{"admin":true}}`)
      .expect(400);

    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("strings: nome de usuário", () => {
  it.each([
    ["só espaços", "      "],
    ["caractere nulo", "Nome\u0000Ruim"],
    ["quebra de linha", "Nome\nRuim"],
    ["tabulação", "Nome\tRuim"],
    ["caractere de controle", "Nome\u0007Ruim"],
    ["surrogate isolado", "Nome\uD800Ruim"],
  ])("recusa %s", async (_label, name) => {
    const response = await createUser(newUser({ name })).expect(400);
    expectValidationError(response.body, "name");
  });

  it.each([
    ["acentos", "José da Conceição"],
    ["apóstrofo", "Maria D'Ávila"],
    ["hífen", "Ana-Paula Souza"],
    ["emoji", "Loja 🍕 da Ana"],
    ["cirílico", "Иван Петров"],
    ["japonês", "田中太郎"],
    ["conteúdo de SQL, que é só texto", "Robert'); DROP TABLE \"User\";--"],
    ["conteúdo de HTML, que é só texto", "<b>Nome</b>"],
  ])("aceita %s", async (_label, name) => {
    const response = await createUser(newUser({ name })).expect(201);
    expect(response.body.name).toBe(name);
  });

  it("remove espaços externos e preserva os internos", async () => {
    const response = await createUser(newUser({ name: "  Ana   Lima  " })).expect(201);
    expect(response.body.name).toBe("Ana   Lima");
  });

  it("normaliza Unicode para NFC", async () => {
    const decomposed = "José";
    const response = await createUser(newUser({ name: decomposed })).expect(201);

    expect(response.body.name).toBe("José");
  });

  it("aceita os limites exatos", async () => {
    await createUser(newUser({ name: "abc" })).expect(201);
    await createUser(newUser({ name: "a".repeat(120) })).expect(201);
  });
});

describe("e-mail", () => {
  it("grava em minúsculas e sem espaços", async () => {
    const local = randomUUID();
    const response = await createUser(newUser({ email: `  ${local.toUpperCase()}@TEST.Local ` })).expect(201);

    expect(response.body.email).toBe(`${local}@test.local`);
  });

  it("unicidade não diferencia maiúsculas", async () => {
    const email = `${randomUUID()}@test.local`;
    await createUser(newUser({ email })).expect(201);

    const response = await createUser(newUser({ email: email.toUpperCase() })).expect(409);
    expect(response.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("detecta duplicado contra conta antiga em maiúsculas", async () => {
    const legacy = await createAccount();
    const mixedCase = legacy.email.toUpperCase();
    await prisma.user.update({ where: { id: legacy.id }, data: { email: mixedCase } });

    await createUser(newUser({ email: mixedCase.toLowerCase() })).expect(409);
  });

  it("atualizar mantendo o próprio e-mail não conflita", async () => {
    await request(app)
      .put(`/api/user/${owner.id}`)
      .set("Authorization", bearer(owner))
      .send({ name: "Nome Novo", email: owner.email.toUpperCase() })
      .expect(200);
  });

  it.each([
    ["sem arroba", "semarroba.com"],
    ["com espaço interno", "a b@test.local"],
    ["sem domínio", "a@"],
    ["acima de 254", `${"a".repeat(250)}@test.local`],
  ])("recusa %s", async (_label, email) => {
    const response = await createUser(newUser({ email })).expect(400);
    expectValidationError(response.body, "email");
  });
});

describe("senha", () => {
  it.each([
    ["só letras", "SomenteLetras"],
    ["só números incomuns", "90817263"],
    ["com espaços", "uma frase longa de senha"],
    ["com unicode", "açãoé🔑chave"],
    ["no limite de 72 bytes", "a".repeat(72)],
  ])("aceita %s", async (_label, password) => {
    await createUser(newUser({ password })).expect(201);
  });

  it.each([
    ["curta", "1234567"],
    ["acima de 72 bytes", "a".repeat(73)],
    ["acima de 72 bytes com unicode", "é".repeat(37)],
    ["só espaços", "          "],
    ["com caractere nulo", "senha\u0000segura"],
    ["muito comum", "password"],
    ["muito comum com maiúsculas", "PassWord1"],
    ["sequência comum", "12345678"],
  ])("recusa %s", async (_label, password) => {
    const response = await createUser(newUser({ password })).expect(400);
    expectValidationError(response.body, "password");
  });

  it("não remove espaços da senha", async () => {
    const email = `${randomUUID()}@test.local`;
    await createUser(newUser({ email, password: " senha com espaços " })).expect(201);

    await request(app)
      .post("/api/auth/login")
      .send({ email, password: " senha com espaços " })
      .expect(200);

    await request(app)
      .post("/api/auth/login")
      .send({ email, password: "senha com espaços" })
      .expect(401);
  });
});

describe("regras de usuário", () => {
  it("não permite excluir o último admin", async () => {
    await prisma.user.updateMany({ where: { id: { not: admin.id } }, data: { admin: false } });

    const response = await request(app)
      .delete(`/api/user/${admin.id}`)
      .set("Authorization", bearer(admin))
      .expect(409);

    expect(response.body.error.code).toBe("LAST_ADMIN");
  });

  it("permite excluir admin quando há outro", async () => {
    const extra = await createAccount(true);

    await request(app)
      .delete(`/api/user/${extra.id}`)
      .set("Authorization", bearer(extra))
      .expect(204);
  });
});

describe("paginação de usuários", () => {
  const list = (query: string) =>
    request(app).get(`/api/user${query}`).set("Authorization", bearer(admin));

  it("limita a página e informa o total", async () => {
    const response = await list("?limit=1&page=1").expect(200);

    expect(response.body).toHaveLength(1);
    expect(Number(response.headers["x-total-count"])).toBeGreaterThan(1);
  });

  it("páginas diferentes trazem registros diferentes", async () => {
    const first = await list("?limit=1&page=1").expect(200);
    const second = await list("?limit=1&page=2").expect(200);

    expect(first.body[0].id).not.toBe(second.body[0].id);
  });

  it("não vaza senha", async () => {
    const response = await list("").expect(200);
    expect(JSON.stringify(response.body)).not.toMatch(/password/i);
  });

  it.each([
    ["limit zero", "?limit=0"],
    ["limit acima do máximo", "?limit=501"],
    ["limit negativo", "?limit=-1"],
    ["limit decimal", "?limit=1.5"],
    ["notação científica", "?limit=1e2"],
    ["texto", "?limit=abc"],
    ["page zero", "?page=0"],
    ["parâmetro repetido", "?limit=1&limit=2"],
    ["parâmetro desconhecido", "?sort=password"],
    ["injeção na ordenação", "?orderBy=password;DROP"],
  ])("recusa %s", async (_label, query) => {
    const response = await list(query).expect(400);
    expectValidationError(response.body);
  });
});

describe("produtos: strings e paginação", () => {
  const product = (overrides: object = {}) => ({ name: "Produto", price: 10, ...overrides });

  it.each([
    ["nome com quebra de linha", { name: "Linha\nDupla" }, "name"],
    ["nome com caractere nulo", { name: "Nome\u0000" }, "name"],
    ["categoria com tabulação", { category: "A\tB" }, "category"],
    ["descrição com caractere nulo", { description: "Texto\u0000" }, "description"],
    ["descrição com controle", { description: "Texto\u0007" }, "description"],
    ["preço infinito por notação", { price: 1e400 }, "price"],
    ["preço nulo", { price: null }, "price"],
  ])("recusa %s", async (_label, overrides, field) => {
    const response = await postProduct(product(overrides)).expect(400);
    expectValidationError(response.body, field);
  });

  it("descrição aceita várias linhas", async () => {
    const description = "Linha 1\nLinha 2\n\tRecuada";
    const response = await postProduct(product({ description })).expect(200);

    expect(response.body.description).toBe(description);
  });

  it("nome aceita emoji e símbolos", async () => {
    const response = await postProduct(product({ name: "Pizza 🍕 50% & Cia" })).expect(200);
    expect(response.body.name).toBe("Pizza 🍕 50% & Cia");
  });

  it("descrição e categoria aceitam null", async () => {
    await postProduct(product({ description: null, category: null })).expect(200);
  });

  it("aceita preços nos limites", async () => {
    await postProduct(product({ price: 0.01 })).expect(200);
    await postProduct(product({ price: 1000000 })).expect(200);
  });

  it("recusa preço acima do limite", async () => {
    await postProduct(product({ price: 1000000.01 })).expect(400);
  });

  it("listagem pagina e informa o total", async () => {
    const paged = await createAccount();
    const auth = bearer(paged);

    for (const name of ["A", "B", "C"]) {
      await request(app).post("/api/product").set("Authorization", auth).send(product({ name })).expect(200);
    }

    const response = await request(app)
      .get("/api/product?limit=2")
      .set("Authorization", auth)
      .expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.headers["x-total-count"]).toBe("3");
  });

  it("recusa limit acima do máximo", async () => {
    await request(app)
      .get("/api/product?limit=501")
      .set("Authorization", bearer(owner))
      .expect(400);
  });
});
