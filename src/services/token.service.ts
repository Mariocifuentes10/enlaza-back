import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { TipoUsuario } from '@prisma/client';
import { env } from '../config/env.js';
import { ApiError } from '../shared/ApiError.js';

export interface AccessTokenPayload {
  tipo: 'access';
  sub: string;
  tipo_usuario: TipoUsuario;
}

export interface RefreshTokenPayload {
  tipo: 'refresh';
  sub: string;
  jti: string;
}

export interface RefreshTokenEmitido {
  token: string;
  expiraEn: Date;
}

const multiplicadoresTtl: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

export function ttlAMilisegundos(ttl: string): number {
  const match = /^(\d+)([smhdw])$/.exec(ttl);
  if (!match) {
    throw new ApiError(500, 'Configuración de token inválida (TTL).', 'CONFIG_INVALIDA');
  }
  const [, valorStr, unidad] = match;
  if (valorStr === undefined || unidad === undefined) {
    throw new ApiError(500, 'Configuración de token inválida (TTL).', 'CONFIG_INVALIDA');
  }
  const multiplicador = multiplicadoresTtl[unidad];
  if (multiplicador === undefined) {
    throw new ApiError(500, 'Configuración de token inválida (TTL).', 'CONFIG_INVALIDA');
  }
  return Number(valorStr) * multiplicador;
}

export function firmarToken(payload: object, ttl: string): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ttl as SignOptions['expiresIn'] });
}

export function verificarToken<T extends object>(token: string): T {
  try {
    return jwt.verify(token, env.JWT_SECRET) as T;
  } catch {
    throw new ApiError(401, 'La sesión no es válida o expiró. Inicia sesión de nuevo.', 'SESION_INVALIDA');
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generarAccessToken(idUsuario: number, tipo: TipoUsuario): string {
  const payload: AccessTokenPayload = { tipo: 'access', sub: String(idUsuario), tipo_usuario: tipo };
  return firmarToken(payload, env.ACCESS_TOKEN_TTL);
}

export function generarRefreshToken(idUsuario: number): RefreshTokenEmitido {
  const expiraEn = new Date(Date.now() + ttlAMilisegundos(env.REFRESH_TOKEN_TTL));
  const payload: RefreshTokenPayload = {
    tipo: 'refresh',
    sub: String(idUsuario),
    jti: crypto.randomUUID(),
  };
  return { token: firmarToken(payload, env.REFRESH_TOKEN_TTL), expiraEn };
}