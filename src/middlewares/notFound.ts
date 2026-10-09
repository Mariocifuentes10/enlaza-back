import type { RequestHandler } from 'express';
import { ApiError } from '../shared/ApiError.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Ruta no encontrada: ${req.method} ${req.path}. Verifica la URL e inténtalo de nuevo.`, 'NOT_FOUND'));
};