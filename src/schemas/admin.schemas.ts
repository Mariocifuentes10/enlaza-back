import { z } from 'zod';

export const idUsuarioAdminParamSchema = z.coerce.number().int().positive();

export const listarUsuariosAdminQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  tipo: z.enum(['candidato', 'empresa', 'mentor', 'admin']).optional(),
  activo: z.enum(['true', 'false']).optional(),
  busqueda: z.string().trim().max(150).optional(),
});

export const actualizarUsuarioAdminSchema = z
  .object({
    activo: z.boolean().optional(),
  })
  .refine((datos) => Object.values(datos).some((valor) => valor !== undefined), {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export const listarEmpresasAdminQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  busqueda: z.string().trim().max(150).optional(),
  sello: z.enum(['pendiente', 'aprobado', 'rechazado', 'sin_sello']).optional(),
});

export type ListarUsuariosAdminQuery = z.infer<typeof listarUsuariosAdminQuerySchema>;
export type ActualizarUsuarioAdminInput = z.infer<typeof actualizarUsuarioAdminSchema>;
export type ListarEmpresasAdminQuery = z.infer<typeof listarEmpresasAdminQuerySchema>;
