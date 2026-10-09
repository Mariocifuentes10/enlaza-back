import { z } from 'zod';

export const idCatalogoParamSchema = z.coerce.number().int().positive();

export const crearHabilidadSchema = z.object({
  nombre_habilidad: z.string().trim().min(1).max(100),
  categoria: z.string().trim().max(50).nullable().optional(),
});

export const crearTipoAjusteSchema = z.object({
  nombre_ajuste: z.string().trim().min(1).max(150),
  descripcion: z.string().trim().max(4000).nullable().optional(),
});

export const habilidadesQuerySchema = z.object({
  categoria: z.string().trim().max(50).optional(),
});

export type CrearHabilidadInput = z.infer<typeof crearHabilidadSchema>;
export type CrearTipoAjusteInput = z.infer<typeof crearTipoAjusteSchema>;