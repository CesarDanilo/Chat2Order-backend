import { Router } from 'express';
import { AuthenticateUserController, LogoutController } from '../../controllers/auth/auth.controller';
import { authMiddleware } from '../../middleware/authUser';
import { loginLimiter } from '../../middleware/rateLimits';
import { validate } from '../../middleware/validate';
import { loginSchema } from '../../schemas/user.schema';

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