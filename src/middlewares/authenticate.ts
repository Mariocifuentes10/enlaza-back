import type { RequestHandler } from 'express';
import { prisma } from '../config/db.js';
import { ApiError } from '../shared/ApiError.js';
import { asyncHandler } from '../shared/asyncHandler.js';
import { verificarToken, type AccessTokenPayload } from '../services/token.service.js';

export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Falta el token de acceso. Inicia sesión para continuar.', 'AUTH_REQUERIDA');
  }

  const token = header.slice('Bearer '.length);
  const payload = verificarToken<AccessTokenPayload>(token);

  if (payload.tipo !== 'access') {
    throw new ApiError(401, 'El token no es válido para esta operación.', 'SESION_INVALIDA');
  }

  const idUsuario = Number(payload.sub);
  if (!Number.isInteger(idUsuario)) {
    throw new ApiError(401, 'La sesión no es válida. Inicia sesión de nuevo.', 'SESION_INVALIDA');
  }

  const usuario = await prisma.usuario.findUnique({ where: { id_usuario: idUsuario } });
  if (!usuario) {
    throw new ApiError(401, 'La cuenta asociada a esta sesión ya no existe.', 'SESION_INVALIDA');
  }
  if (!usuario.activo) {
    throw new ApiError(403, 'Tu cuenta está desactivada. Contacta al administrador.', 'USUARIO_INACTIVO');
  }

  req.usuario = { id_usuario: usuario.id_usuario, tipo: payload.tipo_usuario };
  next();
});