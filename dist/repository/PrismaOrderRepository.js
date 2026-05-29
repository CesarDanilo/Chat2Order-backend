"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/repository/PrismaOrderRepository.ts
var PrismaOrderRepository_exports = {};
__export(PrismaOrderRepository_exports, {
  PrismaOrderRepository: () => PrismaOrderRepository
});
module.exports = __toCommonJS(PrismaOrderRepository_exports);

// src/config/prisma.ts
var import_config = require("dotenv/config");
var import_adapter_pg = require("@prisma/adapter-pg");
var import_client = require("@prisma/client");
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new import_adapter_pg.PrismaPg({ connectionString });
var prisma = new import_client.PrismaClient({ adapter });

// src/repository/PrismaOrderRepository.ts
var PrismaOrderRepository = class {
  async findManyByUserId(userId) {
    return await prisma.order.findMany({
      where: {
        userId
      },
      include: {
        items: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
  }
  async findById(orderId) {
    return await prisma.order.findUnique({
      where: {
        id: orderId
      },
      include: {
        items: true
      }
    });
  }
  async update(orderId, data) {
    const { userId, items, ...rest } = data;
    return await prisma.order.update({
      where: {
        id: orderId
      },
      data: {
        ...rest,
        items: {
          deleteMany: {},
          create: items
        }
      },
      include: {
        items: true
      }
    });
  }
  async create(data) {
    const { userId, items, ...rest } = data;
    return await prisma.order.create({
      data: {
        ...rest,
        user: {
          connect: { id: userId }
        },
        items: items ? {
          create: items
        } : void 0
      }
    });
  }
  async delete(id) {
    return await prisma.order.delete({
      where: { id }
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PrismaOrderRepository
});
