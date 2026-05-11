import { Router } from "express";
import { ParseController } from "../controllers/parse.controller";
import { authMiddleware } from "../middleware/authUser";

const router = Router();
const controller = new ParseController();

router.post('/parse', authMiddleware, controller.handle);

export default router;
