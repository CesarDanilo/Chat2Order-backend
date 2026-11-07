import { Router } from 'express';
import { AuthenticateUserController } from '../../controllers/auth/auth.controller';
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

export default router;