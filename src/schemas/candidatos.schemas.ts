import { z } from 'zod';

export const idCandidatoParamSchema = z.coerce.number().int().positive();

const textoNulo = (max: number) => z.string().trim().max(max).nullable().optional();

export const candidatoActualizarSchema = z
  .object({
    nombre_completo: z.string().trim().min(1).max(150).optional(),
    telefono: textoNulo(20),
    ubicacion: textoNulo(150),
    resumen_perfil: z.string().trim().max(4000).nullable().optional(),
    tipo_discapacidad: textoNulo(100),
    visible_discapacidad: z.boolean().optional(),
    cv_url: z.string().url().max(255).nullable().optional(),
  })
  .refine((datos) => Object.values(datos).some((valor) => valor !== undefined), {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export type DatosActualizarCandidato = z.infer<typeof candidatoActualizarSchema>;