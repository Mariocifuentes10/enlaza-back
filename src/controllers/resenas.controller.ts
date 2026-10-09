import type { RequestHandler } from 'express';
import { asyncHandler } from '../shared/asyncHandler.js';
import { idEmpresaParamSchema } from '../schemas/empresas.schemas.js';
import { crearResenaSchema } from '../schemas/resenas.schemas.js';
import * as resenasService from '../services/resenas.service.js';

export const crear: RequestHandler = asyncHandler(async (req, res) => {
  const idEmpresa = idEmpresaParamSchema.parse(req.params.id);
  const datos = crearResenaSchema.parse(req.body);
  const resena = await resenasService.crear(idEmpresa, datos, req.usuario!);
  res.status(201).json({ success: true, data: resena });
});

export const listar: RequestHandler = asyncHandler(async (req, res) => {
  const idEmpresa = idEmpresaParamSchema.parse(req.params.id);
  const listado = await resenasService.listar(idEmpresa);
  res.json({ success: true, data: listado });
});