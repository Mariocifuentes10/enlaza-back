import { z } from 'zod';

export const idVacanteParamSchema = z.coerce.number().int().positive();

const modalidadSchema = z.enum(['presencial', 'remoto', 'hibrido']);
const salarioSchema = z.number().nonnegative();
const textoOpcional = (max: number) => z.string().trim().max(max).nullable().optional();

export const ajustesSchema = z.array(z.number().int().positive()).max(50).default([]);

const validarSalarios = (datos: { salario_min?: number | null; salario_max?: number | null }, ctx: z.RefinementCtx): void => {
  if (datos.salario_min != null && datos.salario_max != null && datos.salario_min > datos.salario_max) {
    ctx.addIssue({ code: 'custom', path: ['salario_min'], message: 'El salario mínimo no puede ser mayor que el máximo.' });
  }
};

const baseVacanteSchema = z.object({
  titulo: z.string().trim().min(1).max(150),
  descripcion: z.string().trim().min(1).max(8000),
  modalidad: modalidadSchema,
  ubicacion: textoOpcional(150),
  salario_min: salarioSchema.nullable().optional(),
  salario_max: salarioSchema.nullable().optional(),
  fecha_cierre: z.coerce.date().nullable().optional(),
  ajustes: ajustesSchema,
});

export const crearVacanteSchema = baseVacanteSchema.superRefine((datos, ctx) => {
  validarSalarios(datos, ctx);
  if (datos.fecha_cierre != null && datos.fecha_cierre.getTime() <= Date.now()) {
    ctx.addIssue({ code: 'custom', path: ['fecha_cierre'], message: 'La fecha de cierre debe ser futura.' });
  }
});

export const actualizarVacanteSchema = baseVacanteSchema
  .partial()
  .superRefine((datos, ctx) => {
    validarSalarios(datos, ctx);
    if (datos.fecha_cierre != null && datos.fecha_cierre.getTime() <= Date.now()) {
      ctx.addIssue({ code: 'custom', path: ['fecha_cierre'], message: 'La fecha de cierre debe ser futura.' });
    }
  })
  .refine((datos) => Object.values(datos).some((valor) => valor !== undefined), {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export const listarVacantesQuerySchema = z.object({
  estado: z.enum(['activa', 'cerrada', 'en_revision']).default('activa'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export const buscarVacantesQuerySchema = z.object({
  texto: z.string().trim().max(200).optional(),
  ubicacion: z.string().trim().max(150).optional(),
  modalidad: modalidadSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type CrearVacanteInput = z.infer<typeof crearVacanteSchema>;
export type ActualizarVacanteInput = z.infer<typeof actualizarVacanteSchema>;
export type BuscarVacantesQuery = z.infer<typeof buscarVacantesQuerySchema>;
export type ListarVacantesQuery = z.infer<typeof listarVacantesQuerySchema>;