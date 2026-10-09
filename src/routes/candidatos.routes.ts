import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import * as candidatosController from '../controllers/candidatos.controller.js';
import * as matchingController from '../controllers/matching.controller.js';
import * as postulacionesController from '../controllers/postulaciones.controller.js';

export const candidatosRouter = Router();

candidatosRouter.get('/:id', authenticate, candidatosController.obtener);
candidatosRouter.put('/:id', authenticate, candidatosController.actualizar);
candidatosRouter.get('/:id/recomendaciones', authenticate, matchingController.recomendaciones);
candidatosRouter.get('/:id/postulaciones', authenticate, postulacionesController.postulacionesDeCandidato);