import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`Enlaza API escuchando en http://localhost:${env.PORT}`);
});

server.on('error', (error) => {
  logger.error({ err: error }, 'No se pudo iniciar el servidor');
  process.exit(1);
});

const shutdown = (signal: string) => {
  logger.info({ signal }, 'Apagando servidor');
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));