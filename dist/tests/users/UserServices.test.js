"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/controllers/user.controller.ts
var UserController = class {
  async CreateUserController(req, res) {
    const userService = new UserService();
    try {
      const result = await userService.createUser(req.body);
      return res.status(201).json(result);
    } catch (error) {
      return res.status(500);
    }
  }
  async GetAllUsersController(req, res) {
    const userService = new UserService();
    try {
      const result = await userService.GetAllUsers();
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500);
    }
  }
  async GetUserByIdController(req, res) {
    const userService = new UserService();
    if (!req.params.id) throw new Error("id is required");
    const { id } = req.params;
    try {
      const result = await userService.GetUserById(id);
      return res.status(200).json(result);
    } catch (error) {
      return res.status(500);
    }
  }
  async DeleteUserByIdController(req, res) {
    const userService = new UserService();
    if (!req.params.id) throw new Error("id is required");
    const { id } = req.params;
    try {
      const result = await userService.DeleteUserById(id);
      return res.status(204).json(result);
    } catch (error) {
      return res.status(500);
    }
  }
  async UpdateUserByIdController(req, res) {
    const userService = new UserService();
    if (!req.params.id || !req.body.name || !req.body.email || !req.body.password) {
      return res.status(400).json({
        message: "id, name, email and password are required"
      });
    }
    const { id } = req.params;
    const userdata = req.body;
    try {
      const result = await userService.UpdateUserById(id, userdata);
      return res.status(200).json(result);
    } catch (error) {
      if (error.message === "User not found") {
        return res.status(404).json({
          message: error.message
        });
      }
      return res.status(500).json({
        message: "Erro interno"
      });
    }
  }
};

// src/tests/users/UserServices.test.ts
describe("Create User", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });
  it("create", async () => {
    const req = {
      body: {
        name: "test",
        email: "test@test.com",
        password: "password"
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.spyOn(UserService.prototype, "createUser").mockResolvedValueOnce({
      id: "1",
      name: "test",
      email: "test@test.com",
      password: "password",
      createdAt: /* @__PURE__ */ new Date()
    });
    const userController = new UserController();
    await userController.CreateUserController(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });
  it("should delete a user", async () => {
    const req = {
      query: {},
      params: { id: "4f92a1b7-8e5c-4d32-9c1a-6f8b2d0e4a91" },
      body: {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const fakeUser = {
      id: "4f92a1b7-8e5c-4d32-9c1a-6f8b2d0e4a91",
      name: "cesar",
      email: "cesar@gmail.com",
      password: "123456789",
      createdAt: /* @__PURE__ */ new Date()
    };
    jest.spyOn(UserService.prototype, "DeleteUserById").mockResolvedValue(fakeUser);
    const controller = new UserController();
    await controller.DeleteUserByIdController(req, res);
    expect(res.status).toHaveBeenCalledWith(204);
  });
  it("should return 200 and users list", async () => {
    const req = {
      query: {},
      params: {},
      body: {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const userController = new UserController();
    await userController.GetAllUsersController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalled();
  });
  it("should return 200 and user data", async () => {
    const req = {
      query: {},
      params: { id: "4f92a1b7-8e5c-4d32-9c1a-6f8b2d0e4a91" },
      body: {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const fakeUser = {
      id: "4f92a1b7-8e5c-4d32-9c1a-6f8b2d0e4a91",
      name: "cesar",
      email: "cesar@gmail.com",
      password: "123456789",
      createdAt: /* @__PURE__ */ new Date()
    };
    jest.spyOn(UserService.prototype, "GetUserById").mockResolvedValue(fakeUser);
    const userController = new UserController();
    await userController.GetUserByIdController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(fakeUser);
  });
  it("Deve retornar 200 e o usu\xE1rio atualizado", async () => {
    const userData = {
      name: "Jo\xE3o",
      email: "joao@email",
      password: "123456",
      createdAt: /* @__PURE__ */ new Date()
    };
    const req = {
      params: { id: "1" },
      body: userData
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.spyOn(UserService.prototype, "UpdateUserById").mockResolvedValue({ id: "1", ...userData });
    const userController = new UserController();
    await userController.UpdateUserByIdController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: "1",
      name: userData.name,
      email: userData.email,
      password: userData.password,
      createdAt: userData.createdAt
    });
  });
  it("Deve retornar 404 se o usu\xE1rio n\xE3o for encontrado", async () => {
    const userData = {
      name: "Jo\xE3o",
      email: "joao@email",
      password: "123456"
    };
    const req = {
      params: { id: "1" },
      body: userData
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.spyOn(UserService.prototype, "UpdateUserById").mockRejectedValue(new Error("User not found"));
    const userController = new UserController();
    await userController.UpdateUserByIdController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not found"
    });
  });
  it("Deve retornar 500 em erro interno do servidor", async () => {
    const userData = {
      name: "Jo\xE3o",
      email: "joao@email",
      password: "123456"
    };
    const req = {
      params: { id: "1" },
      body: userData
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.spyOn(UserService.prototype, "UpdateUserById").mockRejectedValue(new Error("Erro interno"));
    const userController = new UserController();
    await userController.UpdateUserByIdController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Erro interno"
    });
  });
});
