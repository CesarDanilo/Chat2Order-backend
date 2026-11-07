import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import request from "supertest";
import app from "../../../app";
import { prisma } from "../../../config/prisma";

export const PASSWORD = "Senha-De-Teste-123";

export type Account = { id: string; email: string; token: string };

export async function createAccount(admin = false): Promise<Account> {
  const email = `${randomUUID()}@test.local`;
  const user = await prisma.user.create({
    data: {
      name: "Conta de teste",
      email,
      password: await bcrypt.hash(PASSWORD, 4),
      admin,
    },
  });

  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password: PASSWORD })
    .expect(200);

  return { id: user.id, email, token: login.body.token };
}

export const bearer = (account: Account) => `Bearer ${account.token}`;

export const orderBody = (overrides: object = {}) => ({
  customerName: "Cliente Original",
  customerPhone: "11999999999",
  address: "Rua de Teste, 1",
  paymentMethod: "PIX",
  status: "PENDENTE",
  total: 20,
  source: "SITE",
  items: [{ productName: "Pizza", quantity: 2, unitPrice: 10, totalPrice: 20 }],
  ...overrides,
});

export async function createOrder(owner: Account) {
  const response = await request(app)
    .post("/api/order")
    .set("Authorization", bearer(owner))
    .send(orderBody())
    .expect(200);

  return response.body as { id: string; userId: string };
}

export async function createProduct(owner: Account) {
  const response = await request(app)
    .post("/api/product")
    .set("Authorization", bearer(owner))
    .send({ name: "Produto Original", price: 10 })
    .expect(200);

  return response.body as { id: string; userId: string };
}

export function expectValidationError(body: any, field?: string) {
  expect(body.error.code).toBe("VALIDATION_ERROR");
  expect(Array.isArray(body.error.details)).toBe(true);
  expect(JSON.stringify(body)).not.toMatch(/prisma|node_modules|\.ts:/i);

  if (field) {
    const fields = body.error.details.map((detail: { field: string }) => detail.field);
    expect(fields).toContain(field);
  }
}
