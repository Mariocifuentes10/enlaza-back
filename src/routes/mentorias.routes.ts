import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import * as mentoresController from '../controllers/mentores.controller.js';

export const mentoriasRouter = Router();

mentoriasRouter.post('/', authenticate, authorize('candidato', 'mentor'), mentoresController.agendarMentoria);