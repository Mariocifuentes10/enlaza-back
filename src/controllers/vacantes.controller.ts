import type { RequestHandler } from 'express';
import { asyncHandler } from '../shared/asyncHandler.js';
import {
  actualizarVacanteSchema,
  buscarVacantesQuerySchema,
  crearVacanteSchema,
  idVacanteParamSchema,
  listarVacantesQuerySchema,
} from '../schemas/vacantes.schemas.js';
import * as vacantesService from '../services/vacantes.service.js';
import * as ajustesSugeridosService from '../services/ai/ajustes-sugeridos.service.js';
import * as biasDetectorService from '../services/ai/bias-detector.service.js';

export const crear: RequestHandler = asyncHandler(async (req, res) => {
  const datos = crearVacanteSchema.parse(req.body);
  const vacante = await vacantesService.crear(datos, req.usuario!);
  res.status(201).json({ success: true, data: vacante });
});

export const listar: RequestHandler = asyncHandler(async (req, res) => {
  const filtros = listarVacantesQuerySchema.parse(req.query);
  const listado = await vacantesService.listar(filtros);
  res.json({ success: true, data: listado });
});

export const buscar: RequestHandler = asyncHandler(async (req, res) => {
  const filtros = buscarVacantesQuerySchema.parse(req.query);
  const listado = await vacantesService.buscar(filtros);
  res.json({ success: true, data: listado });
});

export const obtenerDetalle: RequestHandler = asyncHandler(async (req, res) => {
  const id = idVacanteParamSchema.parse(req.params.id);
  const vacante = await vacantesService.obtener(id);
  res.json({ success: true, data: vacante });
});

export const actualizar: RequestHandler = asyncHandler(async (req, res) => {
  const id = idVacanteParamSchema.parse(req.params.id);
  const datos = actualizarVacanteSchema.parse(req.body);
  const vacante = await vacantesService.actualizar(id, datos, req.usuario!);
  res.json({ success: true, data: vacante });
});

export const eliminar: RequestHandler = asyncHandler(async (req, res) => {
  const id = idVacanteParamSchema.parse(req.params.id);
  const resultado = await vacantesService.eliminar(id, req.usuario!);
  res.json({ success: true, data: resultado });
});

export const sugerirAjustes: RequestHandler = asyncHandler(async (req, res) => {
  const id = idVacanteParamSchema.parse(req.params.id);
  const ajustes = await ajustesSugeridosService.sugerirAjustes(id, req.usuario!);
  res.json({ success: true, data: ajustes });
});

export const alertaLenguaje: RequestHandler = asyncHandler(async (req, res) => {
  const id = idVacanteParamSchema.parse(req.params.id);
  const alerta = await biasDetectorService.obtenerAlertaLenguaje(id, req.usuario!);
  res.json({ success: true, data: alerta });
});