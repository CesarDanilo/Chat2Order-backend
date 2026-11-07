import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@prisma/client";

// Dinheiro é Decimal no banco e continua número no JSON, como o frontend espera. Com 2 casas e
// até 10 dígitos inteiros, o valor cabe em um número JavaScript sem perda.
(Prisma.Decimal.prototype as any).toJSON = function toJSON() {
  return this.toNumber();
};

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };