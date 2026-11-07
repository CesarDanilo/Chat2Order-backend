import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";

import { apiRoutes } from "./routes";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import { swaggerOptions } from "./config/swagger";
import { errorHandler } from "../shared/http/errorHandler";
import { globalLimiter } from "../shared/http/rateLimits";
import { requestLogger } from "../shared/http/requestLogger";
import { prisma } from "../shared/database/prisma";

const app = express();

// A API roda atrás de um proxy: sem isto, todos os clientes dividiriam o mesmo IP no rate limit.
app.set("trust proxy", 1);

// Primeiro middleware: registra até as requisições recusadas pelos seguintes.
app.use(requestLogger);

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
 * HEALTH CHECK E RATE LIMIT
 * =========================
 */
// Fora do limite de requisições: é chamado com frequência pela plataforma de hospedagem.
app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ status: "ok", database: "ok", uptime: process.uptime() });
  } catch {
    return res.status(503).json({ status: "error", database: "unavailable", uptime: process.uptime() });
  }
});

app.use(globalLimiter);

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
app.use("/api", apiRoutes);

/**
 * =========================
 * ROOT
 * =========================
 */
app.get("/", (req, res) => {
  res.status(200).send("API Chat2Order rodando 🚀");
});

app.use(errorHandler);

export default app;