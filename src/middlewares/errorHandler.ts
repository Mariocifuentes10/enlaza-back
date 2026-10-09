import type { ErrorRequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { Sentry } from '../config/sentry.js';
import { ApiError } from '../shared/ApiError.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamaño máximo de 5 MB.'
        : 'No se pudo procesar el archivo enviado.';
    res.status(413).json({ success: false, error: { code: 'ARCHIVO_INVALIDO', message } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDACION_FALLIDA',
        message: 'Revisa los datos enviados e inténtalo de nuevo.',
        details: err.issues.map((issue) => ({
          campo: issue.path.join('.'),
          mensaje: issue.message,
        })),
      },
    });
    return;
  }

  const isApiError = err instanceof ApiError;

  if (!isApiError) {
    logger.error({ err }, 'Error no controlado');
    Sentry.captureException(err);
  } else {
    logger.warn({ err }, 'Error controlado');
    if (err.statusCode >= 500) {
      Sentry.captureException(err);
    }
  }

  const statusCode = isApiError ? err.statusCode : 500;
  const code = isApiError ? err.code : 'INTERNAL_ERROR';
  const message = isApiError ? err.message : 'Algo salió mal. Inténtalo de nuevo en unos segundos.';

  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};