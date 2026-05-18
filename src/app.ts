import express from "express";
import cors from "cors";
import parseRoutes from "./routes/parse.routes";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth/auth.routes";
import orderRoutes from "./routes/order.routes";

import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import { swaggerOptions } from "./config/swagger";

const app = express();

app.use(cors());
app.use(express.json());

const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocs)
);

app.use("/api", parseRoutes);
app.use("/api", userRoutes);
app.use("/api", authRoutes);
app.use("/api", orderRoutes);

app.get("/", (req, res) => {
  res.send("API Chat2Order rodando 🚀");
});

export default app;
