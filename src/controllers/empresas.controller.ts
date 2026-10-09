import type { RequestHandler } from 'express';
import { asyncHandler } from '../shared/asyncHandler.js';
import { empresaActualizarSchema, idEmpresaParamSchema } from '../schemas/empresas.schemas.js';
import * as empresasService from '../services/empresas.service.js';

export const obtener: RequestHandler = asyncHandler(async (req, res) => {
  const id = idEmpresaParamSchema.parse(req.params.id);
  const perfil = await empresasService.obtener(id, req.usuario!);
  res.json({ success: true, data: perfil });
});

export const resumen: RequestHandler = asyncHandler(async (req, res) => {
  const id = idEmpresaParamSchema.parse(req.params.id);
  const resumen = await empresasService.resumenPublico(id);
  res.json({ success: true, data: resumen });
});

export const actualizar: RequestHandler = asyncHandler(async (req, res) => {
  const id = idEmpresaParamSchema.parse(req.params.id);
  const datos = empresaActualizarSchema.parse(req.body);
  const perfil = await empresasService.actualizar(id, datos, req.usuario!);
  res.json({ success: true, data: perfil });
});