import type { RequestHandler } from 'express';
import { asyncHandler } from '../shared/asyncHandler.js';
import { candidatoActualizarSchema, idCandidatoParamSchema } from '../schemas/candidatos.schemas.js';
import * as candidatosService from '../services/candidatos.service.js';

export const obtener: RequestHandler = asyncHandler(async (req, res) => {
  const id = idCandidatoParamSchema.parse(req.params.id);
  const perfil = await candidatosService.obtener(id, req.usuario!);
  res.json({ success: true, data: perfil });
});

export const actualizar: RequestHandler = asyncHandler(async (req, res) => {
  const id = idCandidatoParamSchema.parse(req.params.id);
  const datos = candidatoActualizarSchema.parse(req.body);
  const perfil = await candidatosService.actualizar(id, datos, req.usuario!);
  res.json({ success: true, data: perfil });
});