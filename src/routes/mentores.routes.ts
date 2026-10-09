import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import * as mentoresController from '../controllers/mentores.controller.js';

export const mentoresRouter = Router();

mentoresRouter.get('/', authenticate, mentoresController.listarMentores);
mentoresRouter.post('/', authenticate, authorize('candidato'), mentoresController.activarMentor);