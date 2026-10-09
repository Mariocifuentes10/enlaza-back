import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { authRouter } from './auth.routes.js';
import { archivosRouter } from './archivos.routes.js';
import { candidatosRouter } from './candidatos.routes.js';
import { empresasRouter } from './empresas.routes.js';
import { vacantesRouter } from './vacantes.routes.js';
import { catalogosRouter } from './catalogos.routes.js';
import { postulacionesRouter } from './postulaciones.routes.js';
import { chatbotRouter } from './chatbot.routes.js';
import { adminRouter } from './admin.routes.js';
import { mentoresRouter } from './mentores.routes.js';
import { mentoriasRouter } from './mentorias.routes.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/archivos', archivosRouter);
apiRouter.use('/candidatos', candidatosRouter);
apiRouter.use('/empresas', empresasRouter);
apiRouter.use('/vacantes', vacantesRouter);
apiRouter.use('/postulaciones', postulacionesRouter);
apiRouter.use('/chatbot', chatbotRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/mentores', mentoresRouter);
apiRouter.use('/mentorias', mentoriasRouter);
apiRouter.use(catalogosRouter);