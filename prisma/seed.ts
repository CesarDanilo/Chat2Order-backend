// Dados fictícios para desenvolvimento e testes manuais. Uso: npm run db:seed
//
// Idempotente: pode rodar várias vezes, os registros têm id fixo e são atualizados.
// Senhas nunca ficam aqui. Contas novas leem SEED_<CONTA>_PASSWORD; sem a variável, a senha é
// gerada e gravada apenas em .env.dev-credentials, que não vai para o Git.
import "dotenv/config";
import { createHash, randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
import bcrypt from "bcrypt";
import { prisma } from "../src/config/prisma";
import { normalizePhone } from "../src/schemas/phone";
import { calculateOrderTotals } from "../src/services/orderTotals";

const ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]", "postgres"];
const CREDENTIALS_FILE = ".env.dev-credentials";
const ONE_DAY = 24 * 60 * 60 * 1000;

function assertSafeEnvironment() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed recusado: NODE_ENV=production.");
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Seed recusado: DATABASE_URL não definida.");

  const host = new URL(url).hostname;
  if (!ALLOWED_HOSTS.includes(host)) {
    throw new Error(`Seed recusado: o host "${host}" não é um banco local.`);
  }
}

// UUID v4 válido, derivado de um nome fixo para o mesmo registro ter sempre o mesmo id.
function seedId(name: string) {
  const hex = createHash("sha256").update(`chat2order-seed:${name}`).digest("hex");

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

const daysAgo = (days: number) => new Date(Date.now() - days * ONE_DAY);

type SeedProduct = { name: string; category: string; price: number; available?: boolean; description: string };
type SeedItem = { product: string; quantity: number };
type SeedOrder = {
  customerName: string;
  customerPhone: string;
  address: string;
  paymentMethod: "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH";
  status: "PENDENTE" | "CONCLUIDO" | "CANCELADO";
  source: "WHATSAPP" | "SITE";
  daysAgo: number;
  items: SeedItem[];
  rawMessage?: string;
};
type SeedAccount = {
  key: string;
  name: string;
  email: string;
  admin: boolean;
  passwordEnv: string;
  products: SeedProduct[];
  orders: SeedOrder[];
};

const ACCOUNTS: SeedAccount[] = [
  {
    key: "dev",
    name: "Dev Local",
    email: "dev@chat2order.local",
    admin: true,
    passwordEnv: "SEED_DEV_PASSWORD",
    products: [
      { name: "Pizza Calabresa", category: "Pizzas", price: 49.9, description: "Calabresa, cebola e azeitona" },
      { name: "Pizza Margherita", category: "Pizzas", price: 46.5, description: "Tomate, muçarela e manjericão" },
      { name: "Pizza Portuguesa", category: "Pizzas", price: 54, description: "Presunto, ovo, cebola e ervilha" },
      { name: "Esfiha de Carne", category: "Salgados", price: 7.5, description: "Unidade" },
      { name: "Refrigerante 2L", category: "Bebidas", price: 14, description: "Garrafa" },
      { name: "Suco de Laranja", category: "Bebidas", price: 11.9, description: "500 ml" },
      { name: "Pudim", category: "Sobremesas", price: 12.5, description: "Fatia" },
      { name: "Petit Gâteau", category: "Sobremesas", price: 19.9, available: false, description: "Fora de estoque" },
    ],
    orders: [
      {
        customerName: "Ana Ribeiro",
        customerPhone: "(11) 90000-0001",
        address: "Rua das Flores, 120, Centro",
        paymentMethod: "PIX",
        status: "PENDENTE",
        source: "WHATSAPP",
        daysAgo: 0,
        items: [
          { product: "Pizza Calabresa", quantity: 1 },
          { product: "Refrigerante 2L", quantity: 1 },
        ],
        rawMessage: "Boa noite! Quero uma pizza de calabresa e um refri de 2 litros. Pago no pix.",
      },
      {
        customerName: "Bruno Almeida",
        customerPhone: "(11) 90000-0002",
        address: "Av. Paulista, 900, Bela Vista",
        paymentMethod: "CREDIT_CARD",
        status: "PENDENTE",
        source: "SITE",
        daysAgo: 0,
        items: [{ product: "Pizza Portuguesa", quantity: 2 }],
      },
      {
        customerName: "Carla Mendes",
        customerPhone: "(11) 90000-0003",
        address: "Rua Augusta, 45, Consolação",
        paymentMethod: "CASH",
        status: "CONCLUIDO",
        source: "WHATSAPP",
        daysAgo: 1,
        items: [
          { product: "Esfiha de Carne", quantity: 10 },
          { product: "Suco de Laranja", quantity: 2 },
        ],
        rawMessage: "Oi, manda 10 esfihas e 2 sucos de laranja. Pago em dinheiro.",
      },
      {
        customerName: "Diego Souza",
        customerPhone: "(11) 90000-0004",
        address: "Rua Vergueiro, 2000, Vila Mariana",
        paymentMethod: "DEBIT_CARD",
        status: "CONCLUIDO",
        source: "SITE",
        daysAgo: 2,
        items: [
          { product: "Pizza Margherita", quantity: 1 },
          { product: "Pudim", quantity: 2 },
        ],
      },
      {
        customerName: "Elisa Martins",
        customerPhone: "(11) 90000-0005",
        address: "Rua Oscar Freire, 300, Jardins",
        paymentMethod: "PIX",
        status: "CANCELADO",
        source: "WHATSAPP",
        daysAgo: 3,
        items: [{ product: "Pizza Calabresa", quantity: 3 }],
        rawMessage: "Quero 3 pizzas de calabresa... na verdade pode cancelar, desculpa.",
      },
      {
        customerName: "Fábio Lima",
        customerPhone: "(11) 90000-0006",
        address: "Rua da Consolação, 77, Centro",
        paymentMethod: "PIX",
        status: "CONCLUIDO",
        source: "WHATSAPP",
        daysAgo: 5,
        items: [
          { product: "Pizza Portuguesa", quantity: 1 },
          { product: "Refrigerante 2L", quantity: 2 },
        ],
      },
      {
        customerName: "Gabriela Rocha",
        customerPhone: "(11) 90000-0007",
        address: "Rua Haddock Lobo, 15, Cerqueira César",
        paymentMethod: "CREDIT_CARD",
        status: "CONCLUIDO",
        source: "SITE",
        daysAgo: 9,
        items: [{ product: "Esfiha de Carne", quantity: 6 }],
      },
    ],
  },
  {
    key: "dev2",
    name: "Dev Local 2",
    email: "dev2@chat2order.local",
    admin: false,
    passwordEnv: "SEED_DEV2_PASSWORD",
    products: [
      { name: "Hambúrguer Clássico", category: "Lanches", price: 32, description: "Pão, carne e queijo" },
      { name: "Hambúrguer Duplo", category: "Lanches", price: 41.5, description: "Duas carnes" },
      { name: "Batata Frita", category: "Acompanhamentos", price: 18, description: "Porção média" },
      { name: "Milkshake", category: "Bebidas", price: 21.9, description: "Baunilha, 400 ml" },
    ],
    orders: [
      {
        customerName: "Helena Castro",
        customerPhone: "(21) 90000-0011",
        address: "Rua Barata Ribeiro, 50, Copacabana",
        paymentMethod: "PIX",
        status: "PENDENTE",
        source: "WHATSAPP",
        daysAgo: 0,
        items: [
          { product: "Hambúrguer Duplo", quantity: 2 },
          { product: "Batata Frita", quantity: 1 },
        ],
        rawMessage: "Fala! Dois duplos e uma batata, por favor.",
      },
      {
        customerName: "Igor Nunes",
        customerPhone: "(21) 90000-0012",
        address: "Av. Atlântica, 800, Copacabana",
        paymentMethod: "CASH",
        status: "CONCLUIDO",
        source: "SITE",
        daysAgo: 1,
        items: [{ product: "Milkshake", quantity: 3 }],
      },
      {
        customerName: "Júlia Prado",
        customerPhone: "(21) 90000-0013",
        address: "Rua Visconde de Pirajá, 200, Ipanema",
        paymentMethod: "DEBIT_CARD",
        status: "CANCELADO",
        source: "WHATSAPP",
        daysAgo: 4,
        items: [{ product: "Hambúrguer Clássico", quantity: 1 }],
      },
    ],
  },
  {
    key: "loja3",
    name: "Loja Três",
    email: "loja3@chat2order.local",
    admin: false,
    passwordEnv: "SEED_LOJA3_PASSWORD",
    products: [
      { name: "Bolo de Cenoura", category: "Bolos", price: 38, description: "Com cobertura de chocolate" },
      { name: "Café Coado", category: "Bebidas", price: 6.5, description: "Xícara" },
    ],
    orders: [
      {
        customerName: "Lucas Teixeira",
        customerPhone: "(31) 90000-0021",
        address: "Rua da Bahia, 1000, Centro",
        paymentMethod: "PIX",
        status: "CONCLUIDO",
        source: "SITE",
        daysAgo: 2,
        items: [
          { product: "Bolo de Cenoura", quantity: 1 },
          { product: "Café Coado", quantity: 2 },
        ],
      },
    ],
  },
];

async function resolvePasswordHash(account: SeedAccount) {
  const fromEnv = process.env[account.passwordEnv];
  if (fromEnv) return bcrypt.hash(fromEnv, 10);

  const generated = randomBytes(18).toString("base64url");
  appendFileSync(CREDENTIALS_FILE, `${account.key.toUpperCase()}_USER_EMAIL=${account.email}\n`);
  appendFileSync(CREDENTIALS_FILE, `${account.key.toUpperCase()}_USER_PASSWORD=${generated}\n`);

  return bcrypt.hash(generated, 10);
}

// Conta que já existe mantém a senha atual.
async function seedUser(account: SeedAccount) {
  const existing = await prisma.user.findUnique({ where: { email: account.email } });

  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: { name: account.name, admin: account.admin },
    });
  }

  return prisma.user.create({
    data: {
      id: seedId(`user:${account.key}`),
      name: account.name,
      email: account.email,
      admin: account.admin,
      password: await resolvePasswordHash(account),
    },
  });
}

async function seedProducts(account: SeedAccount, userId: string) {
  const prices = new Map<string, { id: string; price: number }>();

  for (const product of account.products) {
    const id = seedId(`product:${account.key}:${product.name}`);
    const data = {
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      available: product.available ?? true,
    };

    await prisma.product.upsert({
      where: { id },
      create: { id, userId, ...data },
      update: data,
    });

    prices.set(product.name, { id, price: product.price });
  }

  return prices;
}

const statusHistory = (order: SeedOrder) =>
  order.status === "PENDENTE" ? ["PENDENTE"] : ["PENDENTE", order.status];

async function seedOrder(
  account: SeedAccount,
  userId: string,
  order: SeedOrder,
  prices: Map<string, { id: string; price: number }>,
) {
  const id = seedId(`order:${account.key}:${order.customerName}`);
  const createdAt = daysAgo(order.daysAgo);

  const { items, total } = calculateOrderTotals(
    order.items.map((item) => {
      const product = prices.get(item.product);
      if (!product) throw new Error(`Produto não encontrado no seed: ${item.product}`);

      return {
        productId: product.id,
        productName: item.product,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    }),
  );

  const data = {
    customerName: order.customerName,
    customerPhone: normalizePhone(order.customerPhone),
    address: order.address,
    paymentMethod: order.paymentMethod,
    status: order.status,
    source: order.source,
    rawMessage: order.rawMessage ?? null,
    total,
    createdAt,
  };

  // Filhos são recriados para que uma nova execução não acumule linhas.
  await prisma.orderStatusHistory.deleteMany({ where: { orderId: id } });
  await prisma.aILog.deleteMany({ where: { orderId: id } });
  await prisma.orderItem.deleteMany({ where: { orderId: id } });

  await prisma.order.upsert({
    where: { id },
    create: { id, userId, ...data },
    update: data,
  });

  await prisma.orderItem.createMany({
    data: items.map((item) => ({ ...item, orderId: id })),
  });

  await prisma.orderStatusHistory.createMany({
    data: statusHistory(order).map((status, index) => ({
      orderId: id,
      status,
      changedAt: new Date(createdAt.getTime() + index * 60 * 60 * 1000),
    })),
  });

  if (order.rawMessage) {
    await prisma.aILog.create({
      data: {
        orderId: id,
        inputText: order.rawMessage,
        aiResponse: { customerName: order.customerName, total },
        success: true,
        createdAt,
      },
    });
  }
}

async function main() {
  assertSafeEnvironment();

  for (const account of ACCOUNTS) {
    const user = await seedUser(account);
    const prices = await seedProducts(account, user.id);

    for (const order of account.orders) {
      await seedOrder(account, user.id, order, prices);
    }

    console.log(`${account.email}: ${account.products.length} produtos, ${account.orders.length} pedidos`);
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
