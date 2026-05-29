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

// src/routes/order.routes.ts
var order_routes_exports = {};
__export(order_routes_exports, {
  default: () => order_routes_default
});
module.exports = __toCommonJS(order_routes_exports);
var import_express = require("express");

// src/services/order.service.ts
var OrderService = class {
  constructor(orderRepository) {
    this.orderRepository = orderRepository;
  }
  async GetOrderByUserId(userId) {
    return await this.orderRepository.findManyByUserId(userId);
  }
  async GetOrderById(orderId) {
    return await this.orderRepository.findById(orderId);
  }
  async CreateOrder(data, userId) {
    data.userId = userId;
    return await this.orderRepository.create(data);
  }
  async UpdateOrder(orderId, data) {
    return await this.orderRepository.update(orderId, data);
  }
  async DeleteOrder(id) {
    return await this.orderRepository.delete(id);
  }
};

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

// src/controllers/order.controller.ts
var OrderController = class {
  async GetOrders(req, res) {
    const orderRepository = new PrismaOrderRepository();
    const orderService = new OrderService(orderRepository);
    try {
      const orders = await orderService.GetOrderByUserId(req.user.id);
      return res.json(orders);
    } catch (error) {
      console.error("\u274C Erro detalhado no OrderController:", error);
      return res.status(500).json({
        error: "Error processing order",
        message: error.message
      });
    }
  }
  async GetOrderById(req, res) {
    const orderRepository = new PrismaOrderRepository();
    const orderService = new OrderService(orderRepository);
    try {
      const id = String(req.params.id);
      const order = await orderService.GetOrderById(id);
      if (!order) {
        return res.status(404).json({
          message: "Pedido n\xE3o encontrado"
        });
      }
      return res.json(order);
    } catch (error) {
      console.error("\u274C Erro detalhado no OrderController:", error);
      return res.status(500).json({
        error: "Error processing order",
        message: error.message
      });
    }
  }
  async CreateOrder(req, res) {
    const orderRepository = new PrismaOrderRepository();
    const orderService = new OrderService(orderRepository);
    try {
      const userId = req.user.id;
      const order = await orderService.CreateOrder(req.body, userId);
      return res.json(order);
    } catch (error) {
      console.error("\u274C Erro detalhado no OrderController:", error);
      return res.status(500).json({
        error: "Error processing order",
        message: error.message
      });
    }
  }
  async UpdateOrder(req, res) {
    const orderRepository = new PrismaOrderRepository();
    const orderService = new OrderService(orderRepository);
    try {
      const { id } = req.params;
      if (!id || Array.isArray(id)) {
        return res.status(400).json({
          error: "ID inv\xE1lido"
        });
      }
      const order = await orderService.UpdateOrder(id, req.body);
      return res.json(order);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        error: "Erro ao atualizar pedido",
        message: error.message
      });
    }
  }
  async DeleteOrder(req, res) {
    const orderRepository = new PrismaOrderRepository();
    const orderService = new OrderService(orderRepository);
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Missing order ID" });
      }
      await orderService.DeleteOrder(id);
      return res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("\u274C Erro detalhado no OrderController:", error);
      return res.status(500).json({
        error: "Internal Server Error",
        message: error.message
      });
    }
  }
};

// src/middleware/authUser.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    const decodedToken = import_jsonwebtoken.default.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decodedToken.sub
    };
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid token"
    });
  }
}

// src/routes/order.routes.ts
var router = (0, import_express.Router)();
var orderController = new OrderController();
router.get("/order", authMiddleware, orderController.GetOrders);
router.get("/order/{:id}", authMiddleware, orderController.GetOrderById);
router.post("/order", authMiddleware, orderController.CreateOrder);
router.put("/order/{:id}", authMiddleware, orderController.UpdateOrder);
router.delete("/order/{:id}", authMiddleware, orderController.DeleteOrder);
var order_routes_default = router;
