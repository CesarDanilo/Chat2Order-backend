import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const router = Router();
const controllerUser = new UserController();

router.post('/user', controllerUser.CreateUserController)
router.get('/user', controllerUser.GetAllUsersController)
router.get('/user/:id', controllerUser.GetUserByIdController)
router.delete('/user/:id', controllerUser.DeleteUserByIdController)
router.put('/user/:id', controllerUser.UpdateUserByIdController)

export default router;