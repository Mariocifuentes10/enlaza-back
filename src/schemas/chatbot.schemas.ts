import { z } from 'zod';

const rolHistorialSchema = z.enum(['usuario', 'asistente']);

export const mensajeHistorialSchema = z.object({
  rol: rolHistorialSchema,
  contenido: z.string().trim().min(1).max(4000),
});

export const mensajeChatbotSchema = z.object({
  mensaje: z.string().trim().min(1).max(4000),
  historial: z.array(mensajeHistorialSchema).max(50).default([]),
});

export type MensajeChatbotInput = z.infer<typeof mensajeChatbotSchema>;
export type MensajeHistorial = z.infer<typeof mensajeHistorialSchema>;