"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/services/user.service.ts
var user_service_exports = {};
__export(user_service_exports, {
  UserService: () => UserService
});
module.exports = __toCommonJS(user_service_exports);

// src/config/prisma.ts
var import_config = require("dotenv/config");
var import_adapter_pg = require("@prisma/adapter-pg");
var import_client = require("@prisma/client");
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new import_adapter_pg.PrismaPg({ connectionString });
var prisma = new import_client.PrismaClient({ adapter });

// src/services/user.service.ts
var import_bcrypt = __toESM(require("bcrypt"));
var UserService = class {
  async createUser(userdata) {
    userdata.password = await import_bcrypt.default.hash(userdata.password, 10);
    const user = await prisma.user.create({
      data: {
        id: userdata.id,
        name: userdata.name,
        email: userdata.email,
        password: userdata.password
      }
    });
    return user;
  }
  async GetAllUsers() {
    const users = await prisma.user.findMany();
    return users;
  }
  async GetUserById(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    return user;
  }
  async DeleteUserById(id) {
    const user = await prisma.user.delete({ where: { id } });
    return user;
  }
  async UpdateUserById(id, userdata) {
    try {
      const data = {
        name: userdata.name,
        email: userdata.email
      };
      if (userdata.password) {
        data.password = await import_bcrypt.default.hash(userdata.password, 10);
      }
      const user = await prisma.user.update({
        where: { id },
        data
      });
      return user;
    } catch (error) {
      if (error.code === "P2025") {
        throw new Error("User not found");
      }
      throw new Error("Internal error");
    }
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserService
});
