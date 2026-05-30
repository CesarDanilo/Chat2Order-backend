import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import parseRoutes from "./routes/parse.routes";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth/auth.routes";
import orderRoutes from "./routes/order.routes";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import { swaggerOptions } from "./config/swagger";

const app = express();

/**
 * =========================
 * SECURITY MIDDLEWARE
 * =========================
 */
app.use(helmet());
console.log("CORS CONFIG LOADED");
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.options("*", cors());
app.use(express.json());

/**
 * =========================
 * RATE LIMIT (GLOBAL)
 * =========================
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, try again later.",
  },
});

app.use(limiter);

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
const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs, {
    explorer: true,
  })
);

/**
 * =========================
 * ROUTES
 * =========================
 */
app.use("/api", parseRoutes);
app.use("/api", userRoutes);
app.use("/api", authRoutes);
app.use("/api", orderRoutes);

/**
 * =========================
 * ROOT
 * =========================
 */
app.get("/", (req, res) => {
  res.status(200).send("API Chat2Order rodando 🚀");
});

export default app;