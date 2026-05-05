import { Router } from "express";
import { ParseController } from "../controllers/parse.controller";

const router = Router();
const controller = new ParseController();

router.post('/parse', controller.handle);

export default router;
