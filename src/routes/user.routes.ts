import { Router } from "express";
import { UserController } from "../controllers/user.controller";

const router = Router();

const controllerUser = new UserController();

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 8f3d2b9a
 *
 *         name:
 *           type: string
 *           example: César Danilo
 *
 *         email:
 *           type: string
 *           example: cesar@email.com
 *
 *     CreateUserBody:
 *       type: object
 *
 *       required:
 *         - name
 *         - email
 *         - password
 *
 *       properties:
 *         name:
 *           type: string
 *           example: César Danilo
 *
 *         email:
 *           type: string
 *           example: cesar@email.com
 *
 *         password:
 *           type: string
 *           example: 12345678
 *
 *     UpdateUserBody:
 *       type: object
 *
 *       properties:
 *         name:
 *           type: string
 *           example: César Danilo
 *
 *         email:
 *           type: string
 *           example: cesar@email.com
 *
 *         password:
 *           type: string
 *           example: 12345678
 */

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Cria um novo usuário
 *
 *     tags:
 *       - User
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserBody'
 *
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *
 *       400:
 *         description: Dados inválidos
 *
 *       500:
 *         description: Erro interno do servidor
 */
router.post("/user", controllerUser.CreateUserController);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Lista todos os usuários
 *
 *     tags:
 *       - User
 *
 *     responses:
 *       200:
 *         description: Lista de usuários
 *
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *
 *               items:
 *                 $ref: '#/components/schemas/User'
 *
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/user", controllerUser.GetAllUsersController);

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Busca usuário por ID
 *
 *     tags:
 *       - User
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: string
 *
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *
 *       404:
 *         description: Usuário não encontrado
 */
router.get("/user/:id", controllerUser.GetUserByIdController);

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Remove usuário por ID
 *
 *     tags:
 *       - User
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: string
 *
 *     responses:
 *       200:
 *         description: Usuário removido com sucesso
 *
 *       404:
 *         description: Usuário não encontrado
 */
router.delete("/user/:id", controllerUser.DeleteUserByIdController);

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Atualiza usuário por ID
 *
 *     tags:
 *       - User
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: string
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserBody'
 *
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *
 *       404:
 *         description: Usuário não encontrado
 *
 *       500:
 *         description: Erro interno do servidor
 */
router.put("/user/:id", controllerUser.UpdateUserByIdController);

export default router;