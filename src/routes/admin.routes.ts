import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import * as selloController from '../controllers/sello.controller.js';

export const adminRouter = Router();

adminRouter.get('/sello', authenticate, authorize('admin'), selloController.listar);
adminRouter.patch('/sello/:id', authenticate, authorize('admin'), selloController.revisar);