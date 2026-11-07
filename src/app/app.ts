import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";

import parseRoutes from "../routes/parse.routes";
import userRoutes from "../modules/users/presentation/user.routes";
import authRoutes from "../modules/auth/presentation/auth.routes";
import orderRoutes from "../modules/orders/presentation/order.routes";
import productRoutes from "../modules/products/presentation/products.routes"

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import { swaggerOptions } from "./config/swagger";
import { errorHandler } from "../shared/http/errorHandler";
import { globalLimiter } from "../shared/http/rateLimits";

const app = express();

// A API roda atrás de um proxy: sem isto, todos os clientes dividiriam o mesmo IP no rate limit.
app.set("trust proxy", 1);

/**
 * =========================
 * SECURITY MIDDLEWARE
 * =========================
 */
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://chat2order-frontend.vercel.app",
    // Só extensões com ID conhecido. Nunca liberar chrome-extension:// de forma genérica.
    ...(process.env.EXTENSION_ORIGINS?.split(",") ?? [])
  ],
  credentials: true,
  exposedHeaders: ["X-Total-Count"]
}));
app.use(express.json({ limit: "200kb" }));

/**
 * =========================
 * RATE LIMIT (GLOBAL)
 * =========================
 */
app.use(globalLimiter);

/**
 * =========================
 * HEALTH CHECK (DEV / PROD)
 * =========================
 */
app.get("/health", (req, res) => {
  return res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
  });
});

/**
 * =========================
 * SWAGGER
 * =========================
 */
// Em produção a documentação não é exposta: ela descreve todas as rotas da API.
if (process.env.NODE_ENV !== "production") {
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerJsdoc(swaggerOptions), {
      explorer: true,
    })
  );
}

/**
 * =========================
 * ROUTES
 * =========================
 */
app.use("/api", parseRoutes);
app.use("/api", userRoutes);
app.use("/api", authRoutes);
app.use("/api", orderRoutes);
app.use("/api", productRoutes);

/**
 * =========================
 * ROOT
 * =========================
 */
app.get("/", (req, res) => {
  res.status(200).send("API Chat2Order rodando 🚀");
});

app.use(errorHandler);

console.log("APP CONFIGURED");
export default app;