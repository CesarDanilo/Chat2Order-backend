import { Router } from "express";
import { authRoutes } from "../modules/auth";
import { orderRoutes } from "../modules/orders";
import { parseRoutes } from "../modules/parsing";
import { productRoutes } from "../modules/products";
import { userRoutes } from "../modules/users";

// Único ponto que conhece todos os módulos. As URLs continuam as mesmas sob /api.
export const apiRoutes = Router();

apiRoutes.use(parseRoutes);
apiRoutes.use(userRoutes);
apiRoutes.use(authRoutes);
apiRoutes.use(orderRoutes);
apiRoutes.use(productRoutes);
