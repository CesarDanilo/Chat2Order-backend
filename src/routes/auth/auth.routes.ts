import { Router } from 'express';
import { AuthenticateUserController } from '../../controllers/auth/auth.controller';

const router = Router();

router.post('/auth/login', AuthenticateUserController)

export default router;