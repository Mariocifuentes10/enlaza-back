import type { RequestHandler } from 'express';
import type { TipoUsuario } from '@prisma/client';
import { ApiError } from '../shared/ApiError.js';

export const authorize =
  (...roles: TipoUsuario[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.usuario) {
      next(new ApiError(401, 'Autenticación requerida.', 'AUTH_REQUERIDA'));
      return;
    }
    if (!roles.includes(req.usuario.tipo)) {
      next(new ApiError(403, 'No tienes permiso para realizar esta acción.', 'PERMISO_DENEGADO'));
      return;
    }
    next();
  };