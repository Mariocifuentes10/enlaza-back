import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import * as catalogosController from '../controllers/catalogos.controller.js';

export const catalogosRouter = Router();

catalogosRouter.get('/habilidades', catalogosController.listarHabilidades);
catalogosRouter.post('/habilidades', authenticate, authorize('admin'), catalogosController.crearHabilidad);
catalogosRouter.delete('/habilidades/:id', authenticate, authorize('admin'), catalogosController.eliminarHabilidad);

catalogosRouter.get('/tipos-ajuste', catalogosController.listarTiposAjuste);
catalogosRouter.post('/tipos-ajuste', authenticate, authorize('admin'), catalogosController.crearTipoAjuste);
catalogosRouter.delete('/tipos-ajuste/:id', authenticate, authorize('admin'), catalogosController.eliminarTipoAjuste);