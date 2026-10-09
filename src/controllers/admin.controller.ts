import type { RequestHandler } from 'express';
import { asyncHandler } from '../shared/asyncHandler.js';
import {
  actualizarUsuarioAdminSchema,
  idUsuarioAdminParamSchema,
  listarEmpresasAdminQuerySchema,
  listarUsuariosAdminQuerySchema,
} from '../schemas/admin.schemas.js';
import * as adminService from '../services/admin.service.js';

export const estadisticas: RequestHandler = asyncHandler(async (_req, res) => {
  const datos = await adminService.obtenerEstadisticas();
  res.json({ success: true, data: datos });
});

export const listarUsuarios: RequestHandler = asyncHandler(async (req, res) => {
  const filtros = listarUsuariosAdminQuerySchema.parse(req.query);
  const listado = await adminService.listarUsuarios(filtros);
  res.json({ success: true, data: listado });
});

export const actualizarUsuario: RequestHandler = asyncHandler(async (req, res) => {
  const id = idUsuarioAdminParamSchema.parse(req.params.id);
  const datos = actualizarUsuarioAdminSchema.parse(req.body);
  const usuario = await adminService.actualizarUsuario(id, datos, req.usuario!);
  res.json({ success: true, data: usuario });
});

export const listarEmpresas: RequestHandler = asyncHandler(async (req, res) => {
  const filtros = listarEmpresasAdminQuerySchema.parse(req.query);
  const listado = await adminService.listarEmpresas(filtros);
  res.json({ success: true, data: listado });
});
