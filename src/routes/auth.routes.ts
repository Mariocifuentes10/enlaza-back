import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authLoginLimiter } from '../middlewares/rateLimiters.js';

export const authRouter = Router();

authRouter.post('/registro', authController.registro);
authRouter.post('/login', authLoginLimiter, authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticate, authController.me);