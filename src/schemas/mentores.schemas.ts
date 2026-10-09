import { z } from 'zod';

export const activarMentorSchema = z.object({
  biografia: z.string().trim().max(4000).optional(),
});

export const agendarMentoriaSchema = z.object({
  id_mentor: z.number().int().positive(),
  fecha_sesion: z.coerce.date().optional(),
  notas: z.string().trim().max(4000).optional(),
});

export type ActivarMentorInput = z.infer<typeof activarMentorSchema>;
export type AgendarMentoriaInput = z.infer<typeof agendarMentoriaSchema>;