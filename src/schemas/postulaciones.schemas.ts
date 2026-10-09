import { z } from 'zod';

export const idPostulacionParamSchema = z.coerce.number().int().positive();

export const estadosPostulacion = ['enviada', 'en_revision', 'entrevista', 'rechazada', 'contratada'] as const;
export const estadosPostulacionSchema = z.enum(estadosPostulacion);

export const estadosDecisionEmpresa = ['en_revision', 'entrevista', 'rechazada', 'contratada'] as const;

export const crearPostulacionSchema = z.object({
  id_vacante: z.number().int().positive(),
});

export const cambiarEstadoSchema = z.object({
  estado: z.enum(estadosDecisionEmpresa),
});

export const listarPostulacionesCandidatoQuerySchema = z.object({
  estado: estadosPostulacionSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const listarPostulacionesRecibidasQuerySchema = z.object({
  estado: estadosPostulacionSchema.optional(),
  id_vacante: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type CrearPostulacionInput = z.infer<typeof crearPostulacionSchema>;
export type CambiarEstadoInput = z.infer<typeof cambiarEstadoSchema>;
export type ListarPostulacionesCandidatoQuery = z.infer<typeof listarPostulacionesCandidatoQuerySchema>;
export type ListarPostulacionesRecibidasQuery = z.infer<typeof listarPostulacionesRecibidasQuerySchema>;