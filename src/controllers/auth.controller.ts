import type { CookieOptions, RequestHandler } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../shared/ApiError.js';
import { asyncHandler } from '../shared/asyncHandler.js';
import { loginValidacionSchema, registroValidacionSchema } from '../schemas/auth.schemas.js';
import * as authService from '../services/auth.service.js';

const opcionesCookie = (): CookieOptions => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/api/auth',
});

export const registro: RequestHandler = asyncHandler(async (req, res) => {
  const datos = registroValidacionSchema.parse(req.body);
  const usuario = await authService.registrar(datos);
  res.status(201).json({ success: true, data: usuario });
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const datos = loginValidacionSchema.parse(req.body);
  const { refresh_token, ...sesion } = await authService.iniciarSesion(datos.correo, datos.contrasena);
  res.cookie(env.REFRESH_COOKIE_NAME, refresh_token, opcionesCookie());
  res.json({ success: true, data: sesion });
});

export const refresh: RequestHandler = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.REFRESH_COOKIE_NAME] as string | undefined;
  if (!token) {
    throw new ApiError(401, 'No hay sesión activa. Inicia sesión de nuevo.', 'AUTH_REQUERIDA');
  }
  const { refresh_token, ...sesion } = await authService.rotarSesion(token);
  res.cookie(env.REFRESH_COOKIE_NAME, refresh_token, opcionesCookie());
  res.json({ success: true, data: sesion });
});

export const logout: RequestHandler = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.REFRESH_COOKIE_NAME] as string | undefined;
  if (token) {
    await authService.cerrarSesion(token);
  }
  res.clearCookie(env.REFRESH_COOKIE_NAME, opcionesCookie());
  res.status(204).send();
});

export const me: RequestHandler = asyncHandler(async (req, res) => {
  const usuario = await authService.obtenerUsuario(req.usuario!.id_usuario);
  res.json({ success: true, data: usuario });
});