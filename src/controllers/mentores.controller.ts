import type { RequestHandler } from 'express';
import { asyncHandler } from '../shared/asyncHandler.js';
import { activarMentorSchema, agendarMentoriaSchema } from '../schemas/mentores.schemas.js';
import * as mentoresService from '../services/mentores.service.js';

export const listarMentores: RequestHandler = asyncHandler(async (_req, res) => {
  const mentores = await mentoresService.listarMentores();
  res.json({ success: true, data: mentores });
});

export const activarMentor: RequestHandler = asyncHandler(async (req, res) => {
  const datos = activarMentorSchema.parse(req.body);
  const mentor = await mentoresService.activarMentor(datos, req.usuario!);
  res.status(201).json({ success: true, data: mentor });
});

export const agendarMentoria: RequestHandler = asyncHandler(async (req, res) => {
  const datos = agendarMentoriaSchema.parse(req.body);
  const mentoria = await mentoresService.agendarMentoria(datos, req.usuario!);
  res.status(201).json({ success: true, data: mentoria });
});