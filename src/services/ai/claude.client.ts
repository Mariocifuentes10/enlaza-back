import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
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

const TIEMPO_LIMITE_MS = 30_000;

export async function llamarClaude(opciones: OpcionesClaude): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new ApiError(
      503,
      'El asistente de IA no está configurado. Contacta al administrador de la plataforma.',
      'IA_NO_CONFIGURADA',
    );
  }

  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_LIMITE_MS);

  let respuesta: Response;
  try {
    respuesta = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: opciones.modelo ?? env.ANTHROPIC_CHAT_MODEL,
        max_tokens: opciones.maxTokens ?? 1024,
        system: opciones.system,
        messages: opciones.mensajes.map((mensaje) => ({ role: mensaje.rol, content: mensaje.contenido })),
      }),
      signal: controlador.signal,
    });
  } catch (error) {
    clearTimeout(temporizador);
    logger.error({ err: error }, 'Fallo de red al contactar a Anthropic');
    throw new ApiError(502, 'No se pudo conectar con el asistente de IA.', 'IA_FALLIDA');
  }
  clearTimeout(temporizador);

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => '');
    logger.error(
      { status: respuesta.status, cuerpo: cuerpo.slice(0, 500) },
      'Anthropic devolvió un error',
    );

    if (respuesta.status === 401 || respuesta.status === 403) {
      throw new ApiError(
        503,
        'La clave de IA no es válida o no tiene permisos. Contacta al administrador de la plataforma.',
        'IA_NO_CONFIGURADA',
      );
    }

    throw new ApiError(502, 'No se pudo conectar con el asistente de IA.', 'IA_FALLIDA');
  }

  const datos = (await respuesta.json()) as RespuestaClaude;
  const texto = datos.content?.find((bloque) => bloque.type === 'text')?.text;
  if (!texto) {
    throw new ApiError(502, 'El asistente de IA no devolvió una respuesta válida.', 'IA_FALLIDA');
  }

  return texto;
}
