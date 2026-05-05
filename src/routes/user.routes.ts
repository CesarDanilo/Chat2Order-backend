import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();
const controllerUser = new UserController();

router.post('/user', controllerUser.CreateUserController)
router.get('/user', controllerUser.GetAllUsersController)

export default router;