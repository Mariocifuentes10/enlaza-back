import type { RequestHandler } from 'express';
import { ApiError } from '../shared/ApiError.js';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new ApiError(404, 'El recurso solicitado no existe.', 'NOT_FOUND'));
};