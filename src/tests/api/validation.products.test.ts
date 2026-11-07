import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { Account, bearer, createAccount, createProduct, expectValidationError } from "./support/helpers";

const product = (overrides: object = {}) => ({
  name: "Produto",
  description: "Descrição",
  category: "Geral",
  price: 10,
  available: true,
  ...overrides,
});

let owner: Account;

beforeAll(async () => {
  owner = await createAccount();
});

afterAll(async () => {
  await prisma.$disconnect();
});

const post = (body: object) =>
  request(app).post("/api/product").set("Authorization", bearer(owner)).send(body);

describe("POST /api/product", () => {
  it.each([
    ["nome vazio", { name: "  " }, "name"],
    ["nome longo", { name: "a".repeat(161) }, "name"],
    ["descrição longa", { description: "a".repeat(2001) }, "description"],
    ["categoria longa", { category: "a".repeat(81) }, "category"],
    ["preço zero", { price: 0 }, "price"],
    ["preço negativo", { price: -1 }, "price"],
    ["preço com 3 casas", { price: 1.234 }, "price"],
    ["preço como texto", { price: "10" }, "price"],
    ["disponível como texto", { available: "sim" }, "available"],
  ])("rejeita %s com 400", async (_label, overrides, field) => {
    const response = await post(product(overrides)).expect(400);
    expectValidationError(response.body, field);
  });

  it.each(["name", "price"])("rejeita corpo sem %s", async (field) => {
    const body: Record<string, unknown> = product();
    delete body[field];

    const response = await post(body).expect(400);
    expectValidationError(response.body, field);
  });

  it("rejeita campos extras, como o dono", async () => {
    const response = await post(product({ userId: owner.id })).expect(400);
    expectValidationError(response.body);
  });

  it("aceita produto só com os campos obrigatórios", async () => {
    await post({ name: "Mínimo", price: 1 }).expect(200);
  });
});

describe("PUT /api/product/:id", () => {
  it("aceita atualização parcial", async () => {
    const created = await createProduct(owner);

    const response = await request(app)
      .put(`/api/product/${created.id}`)
      .set("Authorization", bearer(owner))
      .send({ price: 12.5 })
      .expect(200);

    expect(response.body.price).toBe(12.5);
    expect(response.body.name).toBe("Produto Original");
  });

  it("rejeita corpo vazio", async () => {
    const created = await createProduct(owner);

    await request(app)
      .put(`/api/product/${created.id}`)
      .set("Authorization", bearer(owner))
      .send({})
      .expect(400);
  });

  it("rejeita preço inválido", async () => {
    const created = await createProduct(owner);

    const response = await request(app)
      .put(`/api/product/${created.id}`)
      .set("Authorization", bearer(owner))
      .send({ price: -1 })
      .expect(400);

    expectValidationError(response.body, "price");
  });
});

describe("GET /api/product", () => {
  it("conta sem produtos recebe lista vazia", async () => {
    const empty = await createAccount();

    const response = await request(app)
      .get("/api/product")
      .set("Authorization", bearer(empty))
      .expect(200);

    expect(response.body).toEqual([]);
  });
});

describe("params", () => {
  it("rejeita id que não é UUID", async () => {
    const response = await request(app)
      .delete("/api/product/nao-e-uuid")
      .set("Authorization", bearer(owner))
      .expect(400);

    expectValidationError(response.body, "id");
  });
});
