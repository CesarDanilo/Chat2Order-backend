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

// src/routes/auth/auth.routes.ts
var auth_routes_exports = {};
__export(auth_routes_exports, {
  default: () => auth_routes_default
});
module.exports = __toCommonJS(auth_routes_exports);
var import_express = require("express");

// src/services/auth/AuthenticateUserService.ts
var import_bcrypt = __toESM(require("bcrypt"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var AuthenticateUserService = class {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }
  async execute(email, password) {
    try {
      const user = await this.usersRepository.findByEmail(email);
      if (!user) throw new Error("Invalid credentials");
      const passwordMatch = await import_bcrypt.default.compare(password, user.password);
      if (!passwordMatch) throw new Error("Invalid credentials");
      const token = import_jsonwebtoken.default.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
      return {
        user: {
          "id": user.id,
          "name": user.name,
          "email": user.email,
          "admin": user.admin
        },
        token
      };
    } catch (error) {
      throw new Error("Invalid credentials");
    }
  }
};

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

// src/controllers/auth/auth.controller.ts
async function AuthenticateUserController(req, res) {
  try {
    const { email, password } = req.body;
    const usersRepository = new PrismaUsersRepository();
    const authenticateUserService = new AuthenticateUserService(usersRepository);
    const auth = await authenticateUserService.execute(email, password);
    return res.status(200).json(auth);
  } catch {
    return res.status(401).json({
      message: "Invalid credentials"
    });
  }
}

// src/routes/auth/auth.routes.ts
var router = (0, import_express.Router)();
router.post("/auth/login", AuthenticateUserController);
var auth_routes_default = router;
