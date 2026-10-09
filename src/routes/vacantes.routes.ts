import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import * as vacantesController from '../controllers/vacantes.controller.js';

export const vacantesRouter = Router();

vacantesRouter.get('/buscar', vacantesController.buscar);
vacantesRouter.get('/', vacantesController.listar);
vacantesRouter.get('/:id', vacantesController.obtenerDetalle);

vacantesRouter.post('/', authenticate, authorize('empresa', 'admin'), vacantesController.crear);
vacantesRouter.post('/:id/sugerir-ajustes', authenticate, authorize('empresa', 'admin'), vacantesController.sugerirAjustes);
vacantesRouter.get('/:id/alerta-lenguaje', authenticate, authorize('empresa', 'admin'), vacantesController.alertaLenguaje);
vacantesRouter.put('/:id', authenticate, authorize('empresa', 'admin'), vacantesController.actualizar);
vacantesRouter.delete('/:id', authenticate, authorize('empresa', 'admin'), vacantesController.eliminar);