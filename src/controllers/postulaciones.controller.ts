import type { RequestHandler } from 'express';
import { asyncHandler } from '../shared/asyncHandler.js';
import { idCandidatoParamSchema } from '../schemas/candidatos.schemas.js';
import { idEmpresaParamSchema } from '../schemas/empresas.schemas.js';
import {
  cambiarEstadoSchema,
  crearPostulacionSchema,
  idPostulacionParamSchema,
  listarPostulacionesCandidatoQuerySchema,
  listarPostulacionesRecibidasQuerySchema,
} from '../schemas/postulaciones.schemas.js';
import * as postulacionesService from '../services/postulaciones.service.js';

export const crear: RequestHandler = asyncHandler(async (req, res) => {
  const datos = crearPostulacionSchema.parse(req.body);
  const postulacion = await postulacionesService.crear(datos, req.usuario!);
  res.status(201).json({ success: true, data: postulacion });
});

export const cambiarEstado: RequestHandler = asyncHandler(async (req, res) => {
  const id = idPostulacionParamSchema.parse(req.params.id);
  const datos = cambiarEstadoSchema.parse(req.body);
  const postulacion = await postulacionesService.cambiarEstado(id, datos, req.usuario!);
  res.json({ success: true, data: postulacion });
});

export const postulacionesDeCandidato: RequestHandler = asyncHandler(async (req, res) => {
  const id = idCandidatoParamSchema.parse(req.params.id);
  const filtros = listarPostulacionesCandidatoQuerySchema.parse(req.query);
  const listado = await postulacionesService.postulacionesDeCandidato(id, filtros, req.usuario!);
  res.json({ success: true, data: listado });
});

export const postulacionesRecibidas: RequestHandler = asyncHandler(async (req, res) => {
  const id = idEmpresaParamSchema.parse(req.params.id);
  const filtros = listarPostulacionesRecibidasQuerySchema.parse(req.query);
  const listado = await postulacionesService.postulacionesRecibidasDeEmpresa(id, filtros, req.usuario!);
  res.json({ success: true, data: listado });
});