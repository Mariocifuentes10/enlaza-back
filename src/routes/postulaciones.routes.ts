import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import * as postulacionesController from '../controllers/postulaciones.controller.js';

export const postulacionesRouter = Router();

postulacionesRouter.post('/', authenticate, postulacionesController.crear);
postulacionesRouter.patch('/:id/estado', authenticate, postulacionesController.cambiarEstado);