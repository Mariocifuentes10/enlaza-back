import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import * as selloController from '../controllers/sello.controller.js';
import * as adminController from '../controllers/admin.controller.js';

export const adminRouter = Router();

adminRouter.use(authenticate, authorize('admin'));

adminRouter.get('/estadisticas', adminController.estadisticas);
adminRouter.get('/usuarios', adminController.listarUsuarios);
adminRouter.patch('/usuarios/:id', adminController.actualizarUsuario);
adminRouter.get('/empresas', adminController.listarEmpresas);

adminRouter.get('/sello', selloController.listar);
adminRouter.patch('/sello/:id', selloController.revisar);
