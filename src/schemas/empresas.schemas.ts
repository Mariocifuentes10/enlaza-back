import { z } from 'zod';

export const idEmpresaParamSchema = z.coerce.number().int().positive();

const textoNulo = (max: number) => z.string().trim().max(max).nullable().optional();

export const empresaActualizarSchema = z
  .object({
    nombre_empresa: z.string().trim().min(1).max(150).optional(),
    descripcion: z.string().trim().max(4000).nullable().optional(),
    sitio_web: z.string().url().max(255).nullable().optional(),
    ubicacion: textoNulo(150),
    logo_url: z.string().url().max(255).nullable().optional(),
  })
  .refine((datos) => Object.values(datos).some((valor) => valor !== undefined), {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export type DatosActualizarEmpresa = z.infer<typeof empresaActualizarSchema>;