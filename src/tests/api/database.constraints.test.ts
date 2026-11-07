import { prisma } from "../../shared/database/prisma";
import { Account, createAccount, createOrder, createProduct } from "./support/helpers";

// Grava direto pelo Prisma, sem a API: prova que o banco barra sozinho o que escapar da aplicação.
let owner: Account;
let orderId: string;

beforeAll(async () => {
  owner = await createAccount();
  orderId = (await createOrder(owner)).id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

const orderData = (overrides: object = {}) => ({
  userId: owner.id,
  customerName: "Cliente",
  status: "PENDENTE",
  total: 10,
  source: "SITE",
  ...overrides,
});

const itemData = (overrides: object = {}) => ({
  orderId,
  productName: "Item",
  quantity: 1,
  unitPrice: 1,
  totalPrice: 1,
  ...overrides,
});

const productData = (overrides: object = {}) => ({
  userId: owner.id,
  name: "Produto",
  price: 1,
  ...overrides,
});

describe("constraints de pedido", () => {
  it.each([
    ["status fora da lista", { status: "XPTO" }],
    ["origem fora da lista", { source: "TELEGRAM" }],
    ["pagamento fora da lista", { paymentMethod: "BOLETO" }],
    ["total negativo", { total: -1 }],
    ["cliente vazio", { customerName: "   " }],
    ["cliente longo", { customerName: "a".repeat(121) }],
  ])("recusa %s", async (_label, overrides) => {
    await expect(prisma.order.create({ data: orderData(overrides) })).rejects.toThrow();
  });

  it("aceita pedido válido", async () => {
    await expect(prisma.order.create({ data: orderData() })).resolves.toBeDefined();
  });
});

describe("constraints de item", () => {
  it.each([
    ["quantidade zero", { quantity: 0 }],
    ["quantidade negativa", { quantity: -1 }],
    ["preço negativo", { unitPrice: -1 }],
    ["total negativo", { totalPrice: -1 }],
    ["nome longo", { productName: "a".repeat(201) }],
  ])("recusa %s", async (_label, overrides) => {
    await expect(prisma.orderItem.create({ data: itemData(overrides) })).rejects.toThrow();
  });

  it("aceita item gratuito", async () => {
    await expect(
      prisma.orderItem.create({ data: itemData({ unitPrice: 0, totalPrice: 0 }) }),
    ).resolves.toBeDefined();
  });
});

describe("constraints de produto", () => {
  it.each([
    ["preço zero", { price: 0 }],
    ["preço negativo", { price: -1 }],
    ["nome vazio", { name: " " }],
    ["nome longo", { name: "a".repeat(161) }],
    ["descrição longa", { description: "a".repeat(2001) }],
    ["categoria longa", { category: "a".repeat(81) }],
  ])("recusa %s", async (_label, overrides) => {
    await expect(prisma.product.create({ data: productData(overrides) })).rejects.toThrow();
  });
});

describe("constraints de usuário", () => {
  it.each([
    ["nome longo", { name: "a".repeat(121) }],
    ["e-mail longo", { email: `${"a".repeat(250)}@x.local` }],
  ])("recusa %s", async (_label, overrides) => {
    await expect(
      prisma.user.create({
        data: { name: "Nome", email: "c@x.local", password: "hash", ...overrides },
      }),
    ).rejects.toThrow();
  });
});

describe("histórico", () => {
  it("recusa status fora da lista", async () => {
    await expect(
      prisma.orderStatusHistory.create({ data: { orderId, status: "XPTO" } }),
    ).rejects.toThrow();
  });
});

describe("integridade referencial", () => {
  it("recusa item de pedido inexistente", async () => {
    await expect(
      prisma.orderItem.create({
        data: itemData({ orderId: "00000000-0000-4000-a000-000000000000" }),
      }),
    ).rejects.toThrow();
  });

  it("excluir produto preserva o item com o nome", async () => {
    const product = await createProduct(owner);
    const item = await prisma.orderItem.create({ data: itemData({ productId: product.id }) });

    await prisma.product.delete({ where: { id: product.id } });

    const stored = await prisma.orderItem.findUnique({ where: { id: item.id } });
    expect(stored?.productId).toBeNull();
    expect(stored?.productName).toBe("Item");
  });
});

describe("tipos de dinheiro", () => {
  it("colunas usam decimal com 2 casas", async () => {
    const columns = await prisma.$queryRaw<{ data_type: string; numeric_scale: number }[]>`
      SELECT data_type, numeric_scale FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name IN ('total', 'unitPrice', 'totalPrice', 'price')
    `;

    expect(columns).toHaveLength(4);

    for (const column of columns) {
      expect(column.data_type).toBe("numeric");
      expect(Number(column.numeric_scale)).toBe(2);
    }
  });
});
