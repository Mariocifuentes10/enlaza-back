import { prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { ApiError } from '../../shared/ApiError.js';
import type { UsuarioSolicitante } from '../candidatos.service.js';
import { llamarClaude } from './claude.client.js';

export interface AjusteSugerido {
  id_ajuste: number;
  nombre_ajuste: string;
  descripcion: string | null;
  justificacion: string;
}

interface SugerenciaClaude {
  id_ajuste: number;
  justificacion?: string;
}

function extraerJson(texto: string): unknown {
  const inicio = texto.indexOf('[');
  const fin = texto.lastIndexOf(']');
  const json = inicio >= 0 && fin > inicio ? texto.slice(inicio, fin + 1) : texto;
  try {
    return JSON.parse(json);
  } catch {
    throw new ApiError(502, 'El asistente de IA no devolvió sugerencias válidas.', 'IA_FALLIDA');
  }
}

export async function sugerirAjustes(idVacante: number, solicitante: UsuarioSolicitante): Promise<AjusteSugerido[]> {
  const vacante = await prisma.vacante.findUnique({
    where: { id_vacante: idVacante },
    include: { empresa: { select: { id_usuario: true } } },
  });
  if (!vacante) {
    throw new ApiError(404, 'No se encontró la vacante solicitada.', 'VACANTE_NO_ENCONTRADA');
  }
  if (solicitante.tipo !== 'admin' && solicitante.id_usuario !== vacante.empresa.id_usuario) {
    throw new ApiError(403, 'No tienes permiso para acceder a esta vacante.', 'PERMISO_DENEGADO');
  }

  const catalogo = await prisma.tipoAjuste.findMany({ orderBy: { id_ajuste: 'asc' } });
  const catalogoTexto = catalogo
    .map((ajuste) => `${ajuste.id_ajuste}: ${ajuste.nombre_ajuste}${ajuste.descripcion ? ` - ${ajuste.descripcion}` : ''}`)
    .join('\n');

  const system =
    'Eres un experto en accesibilidad e inclusión laboral. Recomiendas ajustes razonables para puestos de trabajo ' +
    'siguiendo la normativa general de accesibilidad laboral (Convención de la ONU sobre los Derechos de las ' +
    'Personas con Discapacidad, legislación de inclusión laboral y buenas prácticas accesibles). Debes elegir ' +
    'únicamente ajustes del catálogo proporcionado. Responde única y exclusivamente con JSON válido: un arreglo ' +
    'de objetos con la forma [{"id_ajuste": <entero>, "justificacion": "<motivo breve basado en normativa>"}]. ' +
    'Elige como máximo 8 ajustes, solo los verdaderamente relevantes para el puesto.';

  const contenido =
    'Puesto a publicar:\n' +
    `Título: ${vacante.titulo}\n` +
    `Descripción: ${vacante.descripcion}\n` +
    `Modalidad: ${vacante.modalidad}\n` +
    `${vacante.ubicacion ? `Ubicación: ${vacante.ubicacion}\n` : ''}` +
    '\nCatálogo de ajustes disponibles:\n' +
    catalogoTexto;

  let texto: string;
  try {
    texto = await llamarClaude({ system, mensajes: [{ rol: 'user', contenido }], temperature: 0, maxTokens: 1024 });
  } catch (error) {
    logger.warn({ error, id_vacante: idVacante }, 'No se pudo sugerir ajustes para la vacante');
    throw error;
  }

  const parseado = extraerJson(texto);
  if (!Array.isArray(parseado)) {
    throw new ApiError(502, 'El asistente de IA no devolvió sugerencias válidas.', 'IA_FALLIDA');
  }

  const catalogosPorId = new Map(catalogo.map((ajuste) => [ajuste.id_ajuste, ajuste]));
  const sugerencias: SugerenciaClaude[] = parseado as SugerenciaClaude[];

  const resultado: AjusteSugerido[] = [];
  const vistos = new Set<number>();
  for (const sugerencia of sugerencias) {
    const id = Number(sugerencia.id_ajuste);
    if (!Number.isInteger(id) || vistos.has(id)) {
      continue;
    }
    const ajuste = catalogosPorId.get(id);
    if (!ajuste) {
      continue;
    }
    vistos.add(id);
    resultado.push({
      id_ajuste: ajuste.id_ajuste,
      nombre_ajuste: ajuste.nombre_ajuste,
      descripcion: ajuste.descripcion,
      justificacion: typeof sugerencia.justificacion === 'string' ? sugerencia.justificacion : '',
    });
  }

  return resultado;
}