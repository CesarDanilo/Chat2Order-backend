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

// src/repository/PrismaUsersRepository.ts
var PrismaUsersRepository_exports = {};
__export(PrismaUsersRepository_exports, {
  PrismaUsersRepository: () => PrismaUsersRepository
});
module.exports = __toCommonJS(PrismaUsersRepository_exports);

// src/config/prisma.ts
var import_config = require("dotenv/config");
var import_adapter_pg = require("@prisma/adapter-pg");
var import_client = require("@prisma/client");
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new import_adapter_pg.PrismaPg({ connectionString });
var prisma = new import_client.PrismaClient({ adapter });

// src/repository/PrismaUsersRepository.ts
var PrismaUsersRepository = class {
  async create(data) {
    return prisma.user.create({
      data
    });
  }
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: {
        email
      }
    });
  }
  async findById(id) {
    return prisma.user.findUnique({
      where: {
        id
      }
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PrismaUsersRepository
});
