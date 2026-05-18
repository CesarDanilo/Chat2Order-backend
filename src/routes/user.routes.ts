import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();
const controllerUser = new UserController();

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Realiza a criação de usuário
 *     tags:
 *       - user
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
 *               name:
 *                 type: string
 * 
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
router.post('/user', controllerUser.CreateUserController)
router.get('/user', controllerUser.GetAllUsersController)
router.get('/user/:id', controllerUser.GetUserByIdController)
router.delete('/user/:id', controllerUser.DeleteUserByIdController)
router.put('/user/:id', controllerUser.UpdateUserByIdController)

export default router;