import { z } from 'zod';

export const recomendarVacantesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type RecomendarVacantesQuery = z.infer<typeof recomendarVacantesQuerySchema>;