import { randomUUID } from "node:crypto";
import request from "supertest";
import app from "../../app/app";
import { prisma } from "../../shared/database/prisma";
import {
  Account,
  PASSWORD,
  bearer,
  createAccount,
  createOrder,
  createProduct,
  orderBody,
} from "./support/helpers";

function expectNoPassword(payload: unknown) {
  expect(JSON.stringify(payload)).not.toMatch(/password/i);
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe("SEC-01: /api/user exige autenticação", () => {
  let target: Account;

  beforeAll(async () => {
    target = await createAccount();
  });

  it("GET /api/user sem token responde 401", async () => {
    await request(app).get("/api/user").expect(401);
  });

  it("GET /api/user/:id sem token responde 401", async () => {
    await request(app).get(`/api/user/${target.id}`).expect(401);
  });

  it("PUT /api/user/:id sem token responde 401 e não troca a senha", async () => {
    await request(app)
      .put(`/api/user/${target.id}`)
      .send({ name: "Invasor", email: target.email, password: "Senha-Do-Invasor-1" })
      .expect(401);

    await request(app)
      .post("/api/auth/login")
      .send({ email: target.email, password: PASSWORD })
      .expect(200);
  });

  it("DELETE /api/user/:id sem token responde 401 e mantém a conta", async () => {
    await request(app).delete(`/api/user/${target.id}`).expect(401);

    const stillThere = await prisma.user.findUnique({ where: { id: target.id } });
    expect(stillThere).not.toBeNull();
  });
});

describe("SEC-01/SEC-06: permissões entre usuários", () => {
  let user: Account;
  let other: Account;
  let admin: Account;

  beforeAll(async () => {
    user = await createAccount();
    other = await createAccount();
    admin = await createAccount(true);
  });

  it("não-admin não lista usuários", async () => {
    await request(app).get("/api/user").set("Authorization", bearer(user)).expect(403);
  });

  it("não-admin não lê outro usuário", async () => {
    await request(app)
      .get(`/api/user/${other.id}`)
      .set("Authorization", bearer(user))
      .expect(403);
  });

  it("não-admin não edita outro usuário", async () => {
    await request(app)
      .put(`/api/user/${other.id}`)
      .set("Authorization", bearer(user))
      .send({ name: "Invasor", email: other.email, password: "Senha-Do-Invasor-1" })
      .expect(403);

    const unchanged = await prisma.user.findUnique({ where: { id: other.id } });
    expect(unchanged?.name).toBe("Conta de teste");
  });

  it("não-admin não exclui outro usuário", async () => {
    await request(app)
      .delete(`/api/user/${other.id}`)
      .set("Authorization", bearer(user))
      .expect(403);

    const stillThere = await prisma.user.findUnique({ where: { id: other.id } });
    expect(stillThere).not.toBeNull();
  });

  it("usuário lê e edita a própria conta", async () => {
    await request(app)
      .get(`/api/user/${user.id}`)
      .set("Authorization", bearer(user))
      .expect(200);

    const response = await request(app)
      .put(`/api/user/${user.id}`)
      .set("Authorization", bearer(user))
      .send({ name: "Novo Nome", email: user.email })
      .expect(200);

    expect(response.body.name).toBe("Novo Nome");
  });

  it("usuário não se promove a admin", async () => {
    await request(app)
      .put(`/api/user/${user.id}`)
      .set("Authorization", bearer(user))
      .send({ name: "Novo Nome", email: user.email, admin: true })
      .expect(403);

    const stored = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stored?.admin).toBe(false);
  });

  it("admin lista, lê e edita outros usuários", async () => {
    await request(app).get("/api/user").set("Authorization", bearer(admin)).expect(200);
    await request(app)
      .get(`/api/user/${other.id}`)
      .set("Authorization", bearer(admin))
      .expect(200);

    const response = await request(app)
      .put(`/api/user/${other.id}`)
      .set("Authorization", bearer(admin))
      .send({ name: "Editado Pelo Admin", email: other.email, password: PASSWORD })
      .expect(200);

    expect(response.body.name).toBe("Editado Pelo Admin");
  });

  it("GET de usuário inexistente responde 404 para admin", async () => {
    await request(app)
      .get(`/api/user/${randomUUID()}`)
      .set("Authorization", bearer(admin))
      .expect(404);
  });
});

describe("SEC-02: respostas nunca contêm a senha", () => {
  let user: Account;
  let admin: Account;

  beforeAll(async () => {
    user = await createAccount();
    admin = await createAccount(true);
  });

  it("POST /api/user continua público e não devolve a senha", async () => {
    const response = await request(app)
      .post("/api/user")
      .send({ name: "Novo", email: `${randomUUID()}@test.local`, password: PASSWORD })
      .expect(201);

    expectNoPassword(response.body);
  });

  it("POST /api/user recusa admin e id enviados pelo cliente", async () => {
    await request(app)
      .post("/api/user")
      .send({ id: randomUUID(), name: "Novo", email: `${randomUUID()}@test.local`, password: PASSWORD, admin: true })
      .expect(400);
  });

  it("GET /api/user não devolve a senha", async () => {
    const response = await request(app)
      .get("/api/user")
      .set("Authorization", bearer(admin))
      .expect(200);

    expect(response.body.length).toBeGreaterThan(0);
    expectNoPassword(response.body);
  });

  it("GET /api/user/:id não devolve a senha", async () => {
    const response = await request(app)
      .get(`/api/user/${user.id}`)
      .set("Authorization", bearer(user))
      .expect(200);

    expect(response.body.email).toBe(user.email);
    expectNoPassword(response.body);
  });

  it("PUT /api/user/:id não devolve a senha", async () => {
    const response = await request(app)
      .put(`/api/user/${user.id}`)
      .set("Authorization", bearer(user))
      .send({ name: "Nome", email: user.email, password: PASSWORD })
      .expect(200);

    expectNoPassword(response.body);
  });

  it("login não devolve a senha", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: PASSWORD })
      .expect(200);

    expectNoPassword(response.body.user);
  });
});

describe("SEC-03: pedidos são isolados por conta", () => {
  let owner: Account;
  let stranger: Account;
  let admin: Account;

  beforeAll(async () => {
    owner = await createAccount();
    stranger = await createAccount();
    admin = await createAccount(true);
  });

  it("outra conta recebe 404 ao ler o pedido", async () => {
    const order = await createOrder(owner);

    await request(app)
      .get(`/api/order/${order.id}`)
      .set("Authorization", bearer(stranger))
      .expect(404);
  });

  it("admin também não lê pedido de outra conta", async () => {
    const order = await createOrder(owner);

    await request(app)
      .get(`/api/order/${order.id}`)
      .set("Authorization", bearer(admin))
      .expect(404);
  });

  it("outra conta recebe 404 ao alterar e o pedido não muda", async () => {
    const order = await createOrder(owner);

    await request(app)
      .put(`/api/order/${order.id}`)
      .set("Authorization", bearer(stranger))
      .send(orderBody({ customerName: "Alterado" }))
      .expect(404);

    const stored = await prisma.order.findUnique({ where: { id: order.id } });
    expect(stored?.customerName).toBe("Cliente Original");
  });

  it("outra conta recebe 404 ao excluir e o pedido continua", async () => {
    const order = await createOrder(owner);

    await request(app)
      .delete(`/api/order/${order.id}`)
      .set("Authorization", bearer(stranger))
      .expect(404);

    const stored = await prisma.order.findUnique({ where: { id: order.id } });
    expect(stored).not.toBeNull();
  });

  it("a listagem traz só os pedidos da conta", async () => {
    await createOrder(owner);

    const response = await request(app)
      .get("/api/order")
      .set("Authorization", bearer(stranger))
      .expect(200);

    const ids = response.body.map((order: { userId: string }) => order.userId);
    expect(ids).not.toContain(owner.id);
  });

  it("o dono continua lendo, alterando e excluindo", async () => {
    const order = await createOrder(owner);
    const auth = bearer(owner);

    await request(app).get(`/api/order/${order.id}`).set("Authorization", auth).expect(200);

    const updated = await request(app)
      .put(`/api/order/${order.id}`)
      .set("Authorization", auth)
      .send(orderBody({ customerName: "Alterado Pelo Dono" }))
      .expect(200);

    expect(updated.body.customerName).toBe("Alterado Pelo Dono");
    expect(updated.body.items).toHaveLength(1);

    await request(app).delete(`/api/order/${order.id}`).set("Authorization", auth).expect(200);
  });

  it("SEC-05: criação recusa dono enviado no corpo", async () => {
    await request(app)
      .post("/api/order")
      .set("Authorization", bearer(owner))
      .send(orderBody({ userId: stranger.id }))
      .expect(400);
  });

  it("SEC-05: atualização não troca o dono do pedido", async () => {
    const order = await createOrder(owner);

    await request(app)
      .put(`/api/order/${order.id}`)
      .set("Authorization", bearer(owner))
      .send(orderBody({ userId: stranger.id, user: { connect: { id: stranger.id } } }))
      .expect(400);

    const stored = await prisma.order.findUnique({ where: { id: order.id } });
    expect(stored?.userId).toBe(owner.id);
  });
});

describe("SEC-04: produtos são isolados por conta", () => {
  let owner: Account;
  let stranger: Account;

  beforeAll(async () => {
    owner = await createAccount();
    stranger = await createAccount();
  });

  it("outra conta recebe 404 ao ler o produto", async () => {
    const product = await createProduct(owner);

    await request(app)
      .get(`/api/product/${product.id}`)
      .set("Authorization", bearer(stranger))
      .expect(404);
  });

  it("outra conta recebe 404 ao alterar e o preço não muda", async () => {
    const product = await createProduct(owner);

    await request(app)
      .put(`/api/product/${product.id}`)
      .set("Authorization", bearer(stranger))
      .send({ price: 0.01 })
      .expect(404);

    const stored = await prisma.product.findUnique({ where: { id: product.id } });
    expect(Number(stored?.price)).toBe(10);
  });

  it("outra conta recebe 404 ao excluir e o produto continua", async () => {
    const product = await createProduct(owner);

    await request(app)
      .delete(`/api/product/${product.id}`)
      .set("Authorization", bearer(stranger))
      .expect(404);

    const stored = await prisma.product.findUnique({ where: { id: product.id } });
    expect(stored).not.toBeNull();
  });

  it("produto inexistente responde 404", async () => {
    await request(app)
      .get(`/api/product/${randomUUID()}`)
      .set("Authorization", bearer(owner))
      .expect(404);
  });

  it("o dono continua lendo, alterando e excluindo", async () => {
    const product = await createProduct(owner);
    const auth = bearer(owner);

    await request(app).get(`/api/product/${product.id}`).set("Authorization", auth).expect(200);

    const updated = await request(app)
      .put(`/api/product/${product.id}`)
      .set("Authorization", auth)
      .send({ price: 12.5 })
      .expect(200);

    expect(updated.body.price).toBe(12.5);

    await request(app).delete(`/api/product/${product.id}`).set("Authorization", auth).expect(200);
  });

  it("SEC-05: criação recusa dono enviado no corpo", async () => {
    await request(app)
      .post("/api/product")
      .set("Authorization", bearer(owner))
      .send({ name: "Produto", price: 1, userId: stranger.id })
      .expect(400);
  });

  it("SEC-05: atualização não troca o dono do produto", async () => {
    const product = await createProduct(owner);

    await request(app)
      .put(`/api/product/${product.id}`)
      .set("Authorization", bearer(owner))
      .send({ userId: stranger.id })
      .expect(400);

    const stored = await prisma.product.findUnique({ where: { id: product.id } });
    expect(stored?.userId).toBe(owner.id);
  });
});
