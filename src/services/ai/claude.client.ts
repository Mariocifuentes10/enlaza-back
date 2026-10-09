import { env } from '../../config/env.js';
import { ApiError } from '../../shared/ApiError.js';

export interface MensajeClaude {
  rol: 'user' | 'assistant';
  contenido: string;
}

export interface OpcionesClaude {
  system: string;
  mensajes: MensajeClaude[];
  maxTokens?: number;
  temperature?: number;
  modelo?: string;
}

interface RespuestaClaude {
  content?: Array<{ type: string; text?: string }>;
}

export async function llamarClaude(opciones: OpcionesClaude): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new ApiError(503, 'El asistente de IA no está configurado.', 'IA_NO_CONFIGURADA');
  }

  const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: opciones.modelo ?? env.ANTHROPIC_CHAT_MODEL,
      max_tokens: opciones.maxTokens ?? 1024,
      temperature: opciones.temperature ?? 0.7,
      system: opciones.system,
      messages: opciones.mensajes.map((mensaje) => ({ role: mensaje.rol, content: mensaje.contenido })),
    }),
  });

  if (!respuesta.ok) {
    throw new ApiError(502, 'No se pudo conectar con el asistente de IA.', 'IA_FALLIDA');
  }

  const datos = (await respuesta.json()) as RespuestaClaude;
  const texto = datos.content?.find((bloque) => bloque.type === 'text')?.text;
  if (!texto) {
    throw new ApiError(502, 'El asistente de IA no devolvió una respuesta válida.', 'IA_FALLIDA');
  }

  return texto;
}