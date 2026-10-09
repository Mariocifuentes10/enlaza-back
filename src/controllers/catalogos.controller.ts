import type { RequestHandler } from 'express';
import { asyncHandler } from '../shared/asyncHandler.js';
import { crearHabilidadSchema, crearTipoAjusteSchema, habilidadesQuerySchema, idCatalogoParamSchema } from '../schemas/catalogos.schemas.js';
import * as catalogosService from '../services/catalogos.service.js';

export const listarHabilidades: RequestHandler = asyncHandler(async (req, res) => {
  const { categoria } = habilidadesQuerySchema.parse(req.query);
  const habilidades = await catalogosService.listarHabilidades(categoria);
  res.json({ success: true, data: habilidades });
});

export const crearHabilidad: RequestHandler = asyncHandler(async (req, res) => {
  const datos = crearHabilidadSchema.parse(req.body);
  const habilidad = await catalogosService.crearHabilidad(datos);
  res.status(201).json({ success: true, data: habilidad });
});

export const eliminarHabilidad: RequestHandler = asyncHandler(async (req, res) => {
  const id = idCatalogoParamSchema.parse(req.params.id);
  const resultado = await catalogosService.eliminarHabilidad(id);
  res.json({ success: true, data: resultado });
});

export const listarTiposAjuste: RequestHandler = asyncHandler(async (_req, res) => {
  const tiposAjuste = await catalogosService.listarTiposAjuste();
  res.json({ success: true, data: tiposAjuste });
});

export const crearTipoAjuste: RequestHandler = asyncHandler(async (req, res) => {
  const datos = crearTipoAjusteSchema.parse(req.body);
  const tipoAjuste = await catalogosService.crearTipoAjuste(datos);
  res.status(201).json({ success: true, data: tipoAjuste });
});

export const eliminarTipoAjuste: RequestHandler = asyncHandler(async (req, res) => {
  const id = idCatalogoParamSchema.parse(req.params.id);
  const resultado = await catalogosService.eliminarTipoAjuste(id);
  res.json({ success: true, data: resultado });
});