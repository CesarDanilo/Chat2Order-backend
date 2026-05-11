import express from "express";
import cors from "cors";
import parseRoutes from "./routes/parse.routes";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth/auth.routes";
import orderRoutes from "./routes/order.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", parseRoutes);
app.use("/api", userRoutes);
app.use("/api", authRoutes);
app.use("/api", orderRoutes);

app.get("/", (req, res) => {
  res.send("API Chat2Order rodando 🚀");
});

export default app;
