import { z } from 'zod';

export const idSelloParamSchema = z.coerce.number().int().positive();

export const nivelSelloSchema = z.enum(['basico', 'intermedio', 'avanzado']);

export const solicitarSelloSchema = z.object({
  nivel: nivelSelloSchema.optional(),
  evidencia_url: z.string().trim().url().max(255),
});

export const revisarSelloSchema = z
  .object({
    estado: z.enum(['aprobado', 'rechazado']),
    motivo_rechazo: z.string().trim().min(1).max(255).optional(),
  })
  .superRefine((datos, ctx) => {
    if (datos.estado === 'rechazado' && !datos.motivo_rechazo) {
      ctx.addIssue({
        code: 'custom',
        path: ['motivo_rechazo'],
        message: 'El motivo de rechazo es obligatorio cuando se rechaza el sello.',
      });
    }
  });

export const listarSolicitudesQuerySchema = z.object({
  estado: z.enum(['pendiente', 'aprobado', 'rechazado']).default('pendiente'),
});

export type SolicitarSelloInput = z.infer<typeof solicitarSelloSchema>;
export type RevisarSelloInput = z.infer<typeof revisarSelloSchema>;