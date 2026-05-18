import { Router } from "express";

import { ParseController } from "../controllers/parse.controller";
import { authMiddleware } from "../middleware/authUser";

const router = Router();

const controller = new ParseController();

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     ParseMessageBody:
 *       type: object
 *
 *       required:
 *         - message
 *
 *       properties:
 *         message:
 *           type: string
 *
 *           example: |
 *             [12:30] Cliente:
 *             Quero 2 pizzas calabresa e 1 coca cola 2L
 *
 *             [12:31] Loja:
 *             Qual endereço?
 *
 *             [12:32] Cliente:
 *             Rua XPTO 123
 *
 *     OrderItem:
 *       type: object
 *
 *       properties:
 *         productName:
 *           type: string
 *           example: Pizza Calabresa
 *
 *         quantity:
 *           type: number
 *           example: 2
 *
 *         unitPrice:
 *           type: number
 *           example: 50
 *
 *         totalPrice:
 *           type: number
 *           example: 100
 *
 *     ParsedOrder:
 *       type: object
 *
 *       properties:
 *         id:
 *           type: string
 *
 *         customerName:
 *           type: string
 *           example: João
 *
 *         customerPhone:
 *           type: string
 *           example: 67999999999
 *
 *         address:
 *           type: string
 *           example: Rua XPTO 123
 *
 *         paymentMethod:
 *           type: string
 *           example: PIX
 *
 *         total:
 *           type: number
 *           example: 120
 *
 *         status:
 *           type: string
 *           example: pending
 *
 *         source:
 *           type: string
 *           example: whatsapp
 *
 *         items:
 *           type: array
 *
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 */

/**
 * @swagger
 * /parse:
 *   post:
 *     summary: Extrai pedidos automaticamente usando IA
 *
 *     description: |
 *       Endpoint responsável por processar mensagens de WhatsApp
 *       utilizando IA para identificar:
 *
 *       - cliente
 *       - endereço
 *       - produtos
 *       - quantidades
 *       - pagamento
 *       - total do pedido
 *
 *     tags:
 *       - Parser IA
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ParseMessageBody'
 *
 *     responses:
 *       201:
 *         description: Pedido processado com sucesso
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ParsedOrder'
 *
 *       400:
 *         description: Mensagem inválida
 *
 *       401:
 *         description: Usuário não autenticado
 *
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/parse", authMiddleware, controller.handle);

export default router;