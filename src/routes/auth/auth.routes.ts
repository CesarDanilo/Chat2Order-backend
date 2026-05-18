import { Router } from 'express';
import { AuthenticateUserController } from '../../controllers/auth/auth.controller';

const router = Router();

/**
 * @swagger
 * auth/login:
 *   post:
 *     summary: Realiza login do usuário
 *     tags:
 *       - Auth
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             properties:
 *               email:
 *                 type: string
 *
 *               password:
 *                 type: string
 *
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 */
router.post('/auth/login', AuthenticateUserController)

export default router;