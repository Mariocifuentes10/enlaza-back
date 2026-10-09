import type { RequestHandler } from 'express';
import { asyncHandler } from '../shared/asyncHandler.js';
import { idEmpresaParamSchema } from '../schemas/empresas.schemas.js';
import {
  idSelloParamSchema,
  listarSolicitudesQuerySchema,
  revisarSelloSchema,
  solicitarSelloSchema,
} from '../schemas/sello.schemas.js';
import * as selloService from '../services/sello.service.js';

export const solicitar: RequestHandler = asyncHandler(async (req, res) => {
  const idEmpresa = idEmpresaParamSchema.parse(req.params.id);
  const datos = solicitarSelloSchema.parse(req.body);
  const sello = await selloService.solicitar(idEmpresa, datos, req.usuario!);
  res.status(201).json({ success: true, data: sello });
});

export const listar: RequestHandler = asyncHandler(async (req, res) => {
  const filtros = listarSolicitudesQuerySchema.parse(req.query);
  const listado = await selloService.listarSolicitudes(filtros, req.usuario!);
  res.json({ success: true, data: listado });
});

export const revisar: RequestHandler = asyncHandler(async (req, res) => {
  const id = idSelloParamSchema.parse(req.params.id);
  const datos = revisarSelloSchema.parse(req.body);
  const sello = await selloService.revisar(id, datos, req.usuario!);
  res.json({ success: true, data: sello });
});