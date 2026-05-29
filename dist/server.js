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

// src/app.ts
var import_express5 = __toESM(require("express"));
var import_cors = __toESM(require("cors"));

// src/routes/parse.routes.ts
var import_express = require("express");

// src/config/prisma.ts
var import_config = require("dotenv/config");
var import_adapter_pg = require("@prisma/adapter-pg");
var import_client = require("@prisma/client");
var connectionString = `${process.env.DATABASE_URL}`;
var adapter = new import_adapter_pg.PrismaPg({ connectionString });
var prisma = new import_client.PrismaClient({ adapter });

// src/services/parse.service.groq.ts
var import_groq_sdk = __toESM(require("groq-sdk"));
var ParserService = class {
  async execute(message, userId) {
    const groq = new import_groq_sdk.default({ apiKey: process.env.GROQ_API_KEY });
    async function getGroqChatCompletion(message2) {
      return groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `Extraia os dados da conversa de WhatsApp abaixo e retorne apenas o JSON no formato: {"customerName":"Nome","customerPhone":"Telefone","address":"Endere\xE7o","paymentMethod":"Forma de pagamento","items":[{"productName":"Produto","quantity":0,"unitPrice":0.00,"totalPrice":0.00}],"total":0.00}. Regras: Use totalPrice = quantity * unitPrice; Se faltar telefone ou endere\xE7o, use 'N/A'; Retorne apenas o c\xF3digo, sem textos explicativos. Responda apenas com o JSON purificado. N\xE3o use blocos c\xF3digo markdown. Conversa: ` + message2
          }
        ],
        model: "llama-3.1-8b-instant"
      });
    }
    try {
      const chatCompletion = await getGroqChatCompletion(message);
      const response = chatCompletion.choices[0]?.message?.content || "{}";
      const parsedData = JSON.parse(response || "{}");
      const order = await prisma.order.create({
        data: {
          userId,
          customerName: parsedData.customerName || "sem nome",
          customerPhone: parsedData.customerPhone || "(00) 0 0000-0000",
          address: parsedData.address || "sem endere\xE7o",
          paymentMethod: parsedData.paymentMethod || "PIX",
          status: "PENDENTE",
          total: parsedData.total,
          source: "WHATSAPP",
          rawMessage: message,
          items: {
            create: parsedData.items
          }
        },
        include: {
          items: true
        }
      });
      return order;
    } catch (error) {
      console.error("Erro completo:", error);
      if (error.status === 503) {
        throw new Error(
          "A IA est\xE1 temporariamente sobrecarregada. Tente novamente em alguns segundos."
        );
      }
      if (error instanceof SyntaxError) {
        console.error("Erro ao fazer parse do JSON:", error.message);
        throw new Error("Resposta da IA em formato inv\xE1lido. Tente novamente.");
      }
      if (error.code === "P2002" || error.code === "P2003") {
        throw new Error("Erro ao salvar pedido no banco de dados.");
      }
      console.error("Stack trace:", error.stack);
      throw new Error(`Erro ao processar mensagem com IA: ${error.message}`);
    }
  }
};

// src/controllers/parse.controller.ts
var parserService = new ParserService();
var ParseController = class {
  async handle(req, res) {
    try {
      const message = req.body.message;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      const userId = req.user.id;
      const parsedMessage = await parserService.execute(message, userId);
      return res.json(parsedMessage);
    } catch (error) {
      console.error("\u274C Erro detalhado no ParseController:", error);
      return res.status(500).json({
        error: "Error processing order",
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

// src/routes/parse.routes.ts
var router = (0, import_express.Router)();
var controller = new ParseController();
router.post("/parse", authMiddleware, controller.handle);
var parse_routes_default = router;

// src/routes/user.routes.ts
var import_express2 = require("express");

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

// src/routes/user.routes.ts
var router2 = (0, import_express2.Router)();
var controllerUser = new UserController();
router2.post("/user", controllerUser.CreateUserController);
router2.get("/user", controllerUser.GetAllUsersController);
router2.get("/user/:id", controllerUser.GetUserByIdController);
router2.delete("/user/:id", controllerUser.DeleteUserByIdController);
router2.put("/user/:id", controllerUser.UpdateUserByIdController);
var user_routes_default = router2;

// src/routes/auth/auth.routes.ts
var import_express3 = require("express");

// src/services/auth/AuthenticateUserService.ts
var import_bcrypt2 = __toESM(require("bcrypt"));
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
var AuthenticateUserService = class {
  constructor(usersRepository) {
    this.usersRepository = usersRepository;
  }
  async execute(email, password) {
    try {
      const user = await this.usersRepository.findByEmail(email);
      if (!user) throw new Error("Invalid credentials");
      const passwordMatch = await import_bcrypt2.default.compare(password, user.password);
      if (!passwordMatch) throw new Error("Invalid credentials");
      const token = import_jsonwebtoken2.default.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
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
var router3 = (0, import_express3.Router)();
router3.post("/auth/login", AuthenticateUserController);
var auth_routes_default = router3;

// src/routes/order.routes.ts
var import_express4 = require("express");

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

// src/routes/order.routes.ts
var router4 = (0, import_express4.Router)();
var orderController = new OrderController();
router4.get("/order", authMiddleware, orderController.GetOrders);
router4.get("/order/{:id}", authMiddleware, orderController.GetOrderById);
router4.post("/order", authMiddleware, orderController.CreateOrder);
router4.put("/order/{:id}", authMiddleware, orderController.UpdateOrder);
router4.delete("/order/{:id}", authMiddleware, orderController.DeleteOrder);
var order_routes_default = router4;

// src/app.ts
var import_swagger_ui_express = __toESM(require("swagger-ui-express"));
var import_swagger_jsdoc = __toESM(require("swagger-jsdoc"));

// src/config/swagger.ts
var swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chat2Order API",
      version: "1.0.0",
      description: "Documenta\xE7\xE3o da API do Chat2Order"
    },
    servers: [
      {
        url: "http://localhost:3000"
      }
    ]
  },
  apis: ["./src/**/*.ts"]
};

// src/app.ts
var app = (0, import_express5.default)();
app.use((0, import_cors.default)());
app.use(import_express5.default.json());
var swaggerDocs = (0, import_swagger_jsdoc.default)(swaggerOptions);
app.use(
  "/docs",
  import_swagger_ui_express.default.serve,
  import_swagger_ui_express.default.setup(swaggerDocs)
);
app.use("/api", parse_routes_default);
app.use("/api", user_routes_default);
app.use("/api", auth_routes_default);
app.use("/api", order_routes_default);
app.get("/", (req, res) => {
  res.send("API Chat2Order rodando \u{1F680}");
});
var app_default = app;

// src/server.ts
var PORT = process.env.PORT || 3e3;
app_default.listen(PORT, () => {
  console.log(`\u{1F680} Server running on port http://localhost:${PORT}`);
});
