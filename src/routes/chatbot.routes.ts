import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import * as chatbotController from '../controllers/chatbot.controller.js';
import { chatbotLimiter } from '../middlewares/rateLimiters.js';

export const chatbotRouter = Router();

chatbotRouter.post('/mensaje', chatbotLimiter, authenticate, chatbotController.enviarMensaje);