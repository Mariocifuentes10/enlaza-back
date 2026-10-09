import type { RequestHandler } from 'express';
import { asyncHandler } from '../shared/asyncHandler.js';
import { idCandidatoParamSchema } from '../schemas/candidatos.schemas.js';
import { recomendarVacantesQuerySchema } from '../schemas/matching.schemas.js';
import * as matchingService from '../services/ai/matching.service.js';

export const recomendaciones: RequestHandler = asyncHandler(async (req, res) => {
  const id = idCandidatoParamSchema.parse(req.params.id);
  const filtros = recomendarVacantesQuerySchema.parse(req.query);
  const listado = await matchingService.recomendar(id, filtros, req.usuario!);
  res.json({ success: true, data: listado });
});