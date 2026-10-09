import { prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { ApiError } from '../../shared/ApiError.js';
import type { UsuarioSolicitante } from '../candidatos.service.js';
import { llamarClaude } from './claude.client.js';

export interface AlertaLenguajeVacante {
  alerta_lenguaje: boolean;
  sugerencia_redaccion: string | null;
}

interface RespuestaClaudeLenguaje {
  lenguaje_limite?: unknown;
  sugerencia_redaccion?: unknown;
}

function extraerJsonObjeto(texto: string): unknown {
  const inicio = texto.indexOf('{');
  const fin = texto.lastIndexOf('}');
  const json = inicio >= 0 && fin > inicio ? texto.slice(inicio, fin + 1) : texto;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT =
  'Eres un experto en redacción inclusiva y accesible de ofertas de empleo para una plataforma de inclusión laboral de ' +
  'personas con discapacidad. Tu tarea es revisar una vacante y detectar lenguaje potencialmente excluyente o discriminatorio, ' +
  'por ejemplo: requisitos innecesarios (edad, género, apariencia física, "excelente imagen", estado de salud, capacidad física ' +
  'no relacionada con el puesto, disponibilidad total sin justificación), lenguaje capacitista o discriminador por discapacidad ' +
  '("sin discapacidad", "se requiere estar en perfecto estado de salud", "mente joven", "energía de menor", etc.) y expresiones ' +
  'que desalienten a ciertos grupos. En caso de detectar lenguaje problemático, propones una redacción alternativa inclusiva ' +
  'de la vacante. Responde única y exclusivamente con JSON válido con esta forma: ' +
  '{"lenguaje_limite": <true|false>, "sugerencia_redaccion": "<redacción alternativa inclusiva de la vacante>"}.';

export async function analizarLenguaje(idVacante: number): Promise<AlertaLenguajeVacante> {
  const vacante = await prisma.vacante.findUnique({ where: { id_vacante: idVacante } });
  if (!vacante) {
    throw new ApiError(404, 'No se encontró la vacante solicitada.', 'VACANTE_NO_ENCONTRADA');
  }

  const contenido =
    'Vacante a revisar:\n' +
    `Título: ${vacante.titulo}\n` +
    `Descripción: ${vacante.descripcion}\n` +
    `Modalidad: ${vacante.modalidad}\n` +
    `${vacante.ubicacion ? `Ubicación: ${vacante.ubicacion}` : ''}`;

  let texto: string;
  try {
    texto = await llamarClaude({ system: SYSTEM_PROMPT, mensajes: [{ rol: 'user', contenido }], temperature: 0, maxTokens: 1024 });
  } catch (error) {
    logger.warn({ error, id_vacante: idVacante }, 'No se pudo analizar el lenguaje de la vacante');
    throw error;
  }

  const parseado = extraerJsonObjeto(texto);
  if (!parseado || typeof parseado !== 'object') {
    throw new ApiError(502, 'El asistente de IA no devolvió un análisis válido.', 'IA_FALLIDA');
  }

  const datos = parseado as RespuestaClaudeLenguaje;
  const lenguajeLimite = datos.lenguaje_limite === true;
  const sugerencia =
    typeof datos.sugerencia_redaccion === 'string' && datos.sugerencia_redaccion.trim().length > 0
      ? datos.sugerencia_redaccion.trim()
      : null;

  await prisma.vacante.update({
    where: { id_vacante: idVacante },
    data: {
      alerta_lenguaje: lenguajeLimite,
      sugerencia_redaccion: lenguajeLimite ? sugerencia : null,
    },
  });

  return { alerta_lenguaje: lenguajeLimite, sugerencia_redaccion: lenguajeLimite ? sugerencia : null };
}

export async function obtenerAlertaLenguaje(
  idVacante: number,
  solicitante: UsuarioSolicitante,
): Promise<AlertaLenguajeVacante> {
  const vacante = await prisma.vacante.findUnique({
    where: { id_vacante: idVacante },
    select: { id_vacante: true, id_empresa: true, alerta_lenguaje: true, sugerencia_redaccion: true },
  });
  if (!vacante) {
    throw new ApiError(404, 'No se encontró la vacante solicitada.', 'VACANTE_NO_ENCONTRADA');
  }

  if (solicitante.tipo !== 'admin') {
    const empresa = await prisma.empresa.findUnique({ where: { id_usuario: solicitante.id_usuario } });
    if (!empresa || empresa.id_empresa !== vacante.id_empresa) {
      throw new ApiError(403, 'No tienes permiso para ver la alerta de esta vacante.', 'PERMISO_DENEGADO');
    }
  }

  return { alerta_lenguaje: vacante.alerta_lenguaje, sugerencia_redaccion: vacante.sugerencia_redaccion };
}