import { createHash } from 'node:crypto';
import { env } from '../../config/env.js';
import { ApiError } from '../../shared/ApiError.js';

const DIMENSIONES = 128;
const cache = new Map<string, number[]>();

export type EmbeddingVector = number[];

function hashTexto(texto: string): string {
  return createHash('sha256').update(texto).digest('hex');
}

export async function generarEmbedding(texto: string): Promise<EmbeddingVector> {
  const clave = hashTexto(texto);
  const cacheado = cache.get(clave);
  if (cacheado) {
    return cacheado;
  }

  if (!env.ANTHROPIC_API_KEY) {
    throw new ApiError(503, 'La generación de embeddings no está configurada.', 'EMBEDDINGS_NO_CONFIGURADOS');
  }

  const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.ANTHROPIC_EMBEDDING_MODEL,
      max_tokens: 1024,
      temperature: 0,
      system: `Convierte el texto en un vector semántico de exactamente ${DIMENSIONES} números reales entre -1 y 1. Responde únicamente con JSON válido en este formato: {"embedding": [ ... ]}. Sé determinista: ante textos iguales responde con exactamente el mismo vector.`,
      messages: [{ role: 'user', content: texto }],
    }),
  });

  if (!respuesta.ok) {
    throw new ApiError(503, 'No se pudo generar el embedding.', 'EMBEDDINGS_FALLIDOS');
  }

  const datos = (await respuesta.json()) as { content?: Array<{ type: string; text?: string }> };
  const textoRespuesta = datos.content?.find((bloque) => bloque.type === 'text')?.text;
  if (!textoRespuesta) {
    throw new ApiError(503, 'No se pudo generar el embedding.', 'EMBEDDINGS_FALLIDOS');
  }

  const inicio = textoRespuesta.indexOf('{');
  const fin = textoRespuesta.lastIndexOf('}');
  const json = inicio >= 0 && fin > inicio ? textoRespuesta.slice(inicio, fin + 1) : textoRespuesta;

  let vector: unknown;
  try {
    vector = JSON.parse(json);
  } catch {
    throw new ApiError(503, 'No se pudo generar el embedding.', 'EMBEDDINGS_FALLIDOS');
  }

  const embedding = (vector as { embedding?: unknown }).embedding;
  if (!Array.isArray(embedding) || embedding.length !== DIMENSIONES || !embedding.every((valor) => typeof valor === 'number')) {
    throw new ApiError(503, 'No se pudo generar el embedding.', 'EMBEDDINGS_FALLIDOS');
  }

  cache.set(clave, embedding as number[]);
  return embedding as number[];
}