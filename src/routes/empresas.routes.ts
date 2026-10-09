import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import * as empresasController from '../controllers/empresas.controller.js';
import * as postulacionesController from '../controllers/postulaciones.controller.js';
import * as selloController from '../controllers/sello.controller.js';
import * as resenasController from '../controllers/resenas.controller.js';

export const empresasRouter = Router();

empresasRouter.get('/:id', authenticate, empresasController.obtener);
empresasRouter.get('/:id/resumen', authenticate, empresasController.resumen);
empresasRouter.put('/:id', authenticate, empresasController.actualizar);
empresasRouter.get('/:id/postulaciones-recibidas', authenticate, postulacionesController.postulacionesRecibidas);
empresasRouter.post('/:id/sello/solicitar', authenticate, selloController.solicitar);
empresasRouter.post('/:id/resenas', authenticate, authorize('candidato'), resenasController.crear);
empresasRouter.get('/:id/resenas', authenticate, resenasController.listar);