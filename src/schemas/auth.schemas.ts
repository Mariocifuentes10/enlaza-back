import { z } from 'zod';

export const registroValidacionSchema = z.object({
  correo: z.string().trim().toLowerCase().email(),
  contrasena: z.string().min(8).max(72),
  tipo_usuario: z.enum(['candidato', 'empresa', 'mentor']),
  nombre_completo: z.string().trim().min(1).max(150).optional(),
  nombre_empresa: z.string().trim().min(1).max(150).optional(),
});

export const loginValidacionSchema = z.object({
  correo: z.string().trim().toLowerCase().email(),
  contrasena: z.string().min(1),
});

export type DatosRegistro = z.infer<typeof registroValidacionSchema>;
export type DatosLogin = z.infer<typeof loginValidacionSchema>;