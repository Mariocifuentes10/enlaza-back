import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db.js';
import { ApiError } from '../../shared/ApiError.js';
import type { RecomendarVacantesQuery } from '../../schemas/matching.schemas.js';
import type { UsuarioSolicitante } from '../candidatos.service.js';
import { incluirVacante, mapearVacante, type VacanteRespuesta } from '../vacantes.service.js';
import { generarEmbedding, type EmbeddingVector } from './embeddings.provider.js';

export interface RecomendacionRespuesta {
  puntaje_match: number;
  vacante: VacanteRespuesta;
}

export interface ListadoRecomendaciones {
  total: number;
  page: number;
  limit: number;
  data: RecomendacionRespuesta[];
}

const incluirPerfilEmbedding = {
  habilidades: {
    select: {
      nivel: true,
      habilidad: { select: { nombre_habilidad: true } },
    },
  },
} satisfies Prisma.CandidatoInclude;

type CandidatoConPerfilEmbedding = Prisma.CandidatoGetPayload<{ include: typeof incluirPerfilEmbedding }>;

interface TextoVacante {
  titulo: string;
  descripcion: string;
}

function construirTextoPerfilCandidato(candidato: CandidatoConPerfilEmbedding): string {
  const habilidades = candidato.habilidades
    .map((habilitacion) => `${habilitacion.habilidad.nombre_habilidad} nivel ${habilitacion.nivel}`)
    .join(', ');
  return [candidato.resumen_perfil, habilidades].filter(Boolean).join(' ');
}

function construirTextoVacante(vacante: TextoVacante): string {
  return `${vacante.titulo}. ${vacante.descripcion}`;
}

export function cosineSimilarity(izquierda: EmbeddingVector, derecha: EmbeddingVector): number {
  let productoPunto = 0;
  let normaIzquierda = 0;
  let normaDerecha = 0;
  for (let i = 0; i < izquierda.length; i++) {
    const izquierdaActual = izquierda[i] ?? 0;
    const derechaActual = derecha[i] ?? 0;
    productoPunto += izquierdaActual * derechaActual;
    normaIzquierda += izquierdaActual * izquierdaActual;
    normaDerecha += derechaActual * derechaActual;
  }
  if (normaIzquierda === 0 || normaDerecha === 0) {
    return 0;
  }
  return productoPunto / (Math.sqrt(normaIzquierda) * Math.sqrt(normaDerecha));
}

function cosenoAPuntaje(coseno: number): number {
  return Number((Math.max(0, coseno) * 100).toFixed(2));
}

export async function generarEmbeddingVacante(idVacante: number): Promise<void> {
  const vacante = await prisma.vacante.findUnique({
    where: { id_vacante: idVacante },
    select: { titulo: true, descripcion: true },
  });
  if (!vacante) {
    return;
  }
  await generarEmbedding(construirTextoVacante(vacante));
}

export async function calcularPuntajeMatch(idCandidato: number, idVacante: number): Promise<number> {
  const [candidato, vacante] = await Promise.all([
    prisma.candidato.findUnique({ where: { id_candidato: idCandidato }, include: incluirPerfilEmbedding }),
    prisma.vacante.findUnique({
      where: { id_vacante: idVacante },
      select: { titulo: true, descripcion: true },
    }),
  ]);

  if (!candidato || !vacante) {
    throw new ApiError(404, 'No se encontró el candidato o la vacante solicitada.', 'RECURSO_NO_ENCONTRADO');
  }

  const [vectorCandidato, vectorVacante] = await Promise.all([
    generarEmbedding(construirTextoPerfilCandidato(candidato)),
    generarEmbedding(construirTextoVacante(vacante)),
  ]);

  return cosenoAPuntaje(cosineSimilarity(vectorCandidato, vectorVacante));
}

export async function recomendar(
  idCandidato: number,
  filtros: RecomendarVacantesQuery,
  solicitante: UsuarioSolicitante,
): Promise<ListadoRecomendaciones> {
  const candidato = await prisma.candidato.findUnique({
    where: { id_candidato: idCandidato },
    include: incluirPerfilEmbedding,
  });
  if (!candidato) {
    throw new ApiError(404, 'No se encontró el perfil de candidato solicitado.', 'CANDIDATO_NO_ENCONTRADO');
  }
  if (solicitante.tipo !== 'admin' && solicitante.id_usuario !== candidato.id_usuario) {
    throw new ApiError(403, 'No tienes permiso para ver estas recomendaciones.', 'PERMISO_DENEGADO');
  }

  const vectorCandidato = await generarEmbedding(construirTextoPerfilCandidato(candidato));

  const postuladas = await prisma.postulacion.findMany({
    where: { id_candidato: idCandidato },
    select: { id_vacante: true },
  });
  const idsPostuladas = new Set(postuladas.map((postulacion) => postulacion.id_vacante));

  const vacantes = await prisma.vacante.findMany({
    where: { estado: 'activa' },
    include: incluirVacante,
  });

  const resultados: RecomendacionRespuesta[] = [];
  for (const vacante of vacantes) {
    if (idsPostuladas.has(vacante.id_vacante)) {
      continue;
    }
    try {
      const vectorVacante = await generarEmbedding(construirTextoVacante(vacante));
      const puntaje = cosenoAPuntaje(cosineSimilarity(vectorCandidato, vectorVacante));
      resultados.push({ puntaje_match: puntaje, vacante: mapearVacante(vacante) });
    } catch {
      continue;
    }
  }

  resultados.sort(
    (a, b) =>
      b.puntaje_match - a.puntaje_match ||
      new Date(b.vacante.fecha_publicacion).getTime() - new Date(a.vacante.fecha_publicacion).getTime(),
  );

  const total = resultados.length;
  const page = filtros.page;
  const limit = filtros.limit;
  const data = resultados.slice((page - 1) * limit, page * limit);

  return { total, page, limit, data };
}