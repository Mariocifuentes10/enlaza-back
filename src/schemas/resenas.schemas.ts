import { z } from 'zod';

export const crearResenaSchema = z.object({
  calificacion: z.number().int().min(1).max(5),
  comentario: z.string().trim().min(1).max(4000).optional(),
});

export type CrearResenaInput = z.infer<typeof crearResenaSchema>;