import { Router } from 'express';
import { register, login, refresh, logout, getMe, changePassword, getUsers } from '../controllers/auth.controller';
import { protect } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/auth';

const router = Router();

router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.get('/users', protect, getUsers);
router.post('/change-password', protect, validateRequest(changePasswordSchema), changePassword);

export default router;
