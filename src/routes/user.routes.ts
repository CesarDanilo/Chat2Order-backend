import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();
const create_user = new UserController();

router.post('/user', create_user.CreateUserController)

export default router;