import { Router } from 'express';
import { AuthenticateUserController, LogoutController } from './auth.controller';
import { authMiddleware } from './authMiddleware';
import { loginLimiter } from '../../../shared/http/rateLimits';
import { validate } from '../../../shared/http/validate';
import { loginSchema } from './auth.schema';

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
router.post('/auth/login', loginLimiter, validate({ body: loginSchema }), AuthenticateUserController)

// Encerra só a sessão que fez a chamada. Trocar a senha encerra todas.
router.post('/auth/logout', authMiddleware, validate(), LogoutController)

export default router;