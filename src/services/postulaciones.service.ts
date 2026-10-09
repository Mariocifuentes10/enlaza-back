import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../shared/ApiError.js';
import type { UsuarioSolicitante } from './candidatos.service.js';
import { calcularPuntajeMatch } from './ai/matching.service.js';
import type { CambiarEstadoInput, ListarPostulacionesCandidatoQuery, ListarPostulacionesRecibidasQuery } from '../schemas/postulaciones.schemas.js';

export interface EmpresaPostulacionRespuesta {
  id_empresa: number;
  nombre_empresa: string;
  logo_url: string | null;
  ubicacion: string | null;
  sello: { nivel: string; estado: string } | null;
}

export interface VacantePostulacionRespuesta {
  id_vacante: number;
  titulo: string;
  modalidad: string;
  ubicacion: string | null;
  salario_min: number | null;
  salario_max: number | null;
  estado: string;
  empresa: EmpresaPostulacionRespuesta;
}

export interface PostulacionCandidatoRespuesta {
  id_postulacion: number;
  id_candidato: number;
  id_vacante: number;
  estado: string;
  fecha_postulacion: Date;
  puntaje_match: number | null;
  vacante: VacantePostulacionRespuesta;
}

export interface CandidatoPostulacionRespuesta {
  id_candidato: number;
  nombre_completo: string;
  telefono: string | null;
  ubicacion: string | null;
  resumen_perfil: string | null;
  cv_url: string | null;
  visible_discapacidad: boolean;
  tipo_discapacidad: string | null;
  habilidades: Array<{ id_habilidad: number; nombre_habilidad: string; categoria: string | null; nivel: string }>;
  ajustes: Array<{ id_ajuste: number; nombre_ajuste: string }>;
}

export interface PostulacionRecibidaRespuesta extends PostulacionCandidatoRespuesta {
  candidato: CandidatoPostulacionRespuesta;
}

export interface ListadoPostulaciones {
  total: number;
  page: number;
  limit: number;
  data: PostulacionCandidatoRespuesta[];
}

export interface ListadoPostulacionesRecibidas {
  total: number;
  page: number;
  limit: number;
  data: PostulacionRecibidaRespuesta[];
  resumen: { por_estado: Record<string, number> };
}

const incluirPostulacion = {
  vacante: {
    select: {
      id_vacante: true,
      titulo: true,
      modalidad: true,
      ubicacion: true,
      salario_min: true,
      salario_max: true,
      estado: true,
      empresa: {
        select: {
          id_empresa: true,
          nombre_empresa: true,
          logo_url: true,
          ubicacion: true,
          sello: { select: { nivel: true, estado: true } },
        },
      },
    },
  },
} satisfies Prisma.PostulacionInclude;

const incluirPostulacionRecibida = {
  vacante: {
    select: {
      id_vacante: true,
      titulo: true,
      modalidad: true,
      ubicacion: true,
      salario_min: true,
      salario_max: true,
      estado: true,
      empresa: {
        select: {
          id_empresa: true,
          nombre_empresa: true,
          logo_url: true,
          ubicacion: true,
          sello: { select: { nivel: true, estado: true } },
        },
      },
    },
  },
  candidato: {
    select: {
      id_candidato: true,
      nombre_completo: true,
      telefono: true,
      ubicacion: true,
      resumen_perfil: true,
      cv_url: true,
      visible_discapacidad: true,
      tipo_discapacidad: true,
      habilidades: {
        select: {
          nivel: true,
          habilidad: { select: { id_habilidad: true, nombre_habilidad: true, categoria: true } },
        },
      },
      ajustes: {
        select: {
          ajuste: { select: { id_ajuste: true, nombre_ajuste: true } },
        },
      },
    },
  },
} satisfies Prisma.PostulacionInclude;

type PostulacionConVacante = Prisma.PostulacionGetPayload<{ include: typeof incluirPostulacion }>;
type PostulacionConCandidato = Prisma.PostulacionGetPayload<{ include: typeof incluirPostulacionRecibida }>;

function convertirPuntaje(puntaje: Prisma.Decimal | null): number | null {
  return puntaje == null ? null : Number(puntaje);
}

function mapearVacante(vacante: PostulacionConVacante['vacante']): VacantePostulacionRespuesta {
  return {
    id_vacante: vacante.id_vacante,
    titulo: vacante.titulo,
    modalidad: vacante.modalidad,
    ubicacion: vacante.ubicacion,
    salario_min: vacante.salario_min == null ? null : Number(vacante.salario_min),
    salario_max: vacante.salario_max == null ? null : Number(vacante.salario_max),
    estado: vacante.estado,
    empresa: {
      id_empresa: vacante.empresa.id_empresa,
      nombre_empresa: vacante.empresa.nombre_empresa,
      logo_url: vacante.empresa.logo_url,
      ubicacion: vacante.empresa.ubicacion,
      sello: vacante.empresa.sello
        ? { nivel: vacante.empresa.sello.nivel, estado: vacante.empresa.sello.estado }
        : null,
    },
  };
}

const mapearPostulacionCandidato = (postulacion: PostulacionConVacante): PostulacionCandidatoRespuesta => ({
  id_postulacion: postulacion.id_postulacion,
  id_candidato: postulacion.id_candidato,
  id_vacante: postulacion.id_vacante,
  estado: postulacion.estado,
  fecha_postulacion: postulacion.fecha_postulacion,
  puntaje_match: convertirPuntaje(postulacion.puntaje_match),
  vacante: mapearVacante(postulacion.vacante),
});

function mapearCandidato(candidato: PostulacionConCandidato['candidato']): CandidatoPostulacionRespuesta {
  return {
    id_candidato: candidato.id_candidato,
    nombre_completo: candidato.nombre_completo,
    telefono: candidato.telefono,
    ubicacion: candidato.ubicacion,
    resumen_perfil: candidato.resumen_perfil,
    cv_url: candidato.cv_url,
    visible_discapacidad: candidato.visible_discapacidad,
    tipo_discapacidad: candidato.visible_discapacidad ? candidato.tipo_discapacidad : null,
    habilidades: candidato.habilidades.map((hc) => ({
      id_habilidad: hc.habilidad.id_habilidad,
      nombre_habilidad: hc.habilidad.nombre_habilidad,
      categoria: hc.habilidad.categoria,
      nivel: hc.nivel,
    })),
    ajustes: candidato.ajustes.map((ac) => ({
      id_ajuste: ac.ajuste.id_ajuste,
      nombre_ajuste: ac.ajuste.nombre_ajuste,
    })),
  };
}

const mapearPostulacionRecibida = (postulacion: PostulacionConCandidato): PostulacionRecibidaRespuesta => ({
  ...mapearPostulacionCandidato(postulacion),
  candidato: mapearCandidato(postulacion.candidato),
});

export async function crear(datos: { id_vacante: number }, solicitante: UsuarioSolicitante): Promise<PostulacionCandidatoRespuesta> {
  if (solicitante.tipo !== 'candidato') {
    throw new ApiError(403, 'Solo los candidatos pueden postularse a una vacante.', 'CANDIDATO_REQUERIDO');
  }

  const candidato = await prisma.candidato.findUnique({ where: { id_usuario: solicitante.id_usuario } });
  if (!candidato) {
    throw new ApiError(404, 'No se encontró el perfil de candidato solicitado.', 'CANDIDATO_NO_ENCONTRADO');
  }

  const vacante = await prisma.vacante.findUnique({ where: { id_vacante: datos.id_vacante } });
  if (!vacante) {
    throw new ApiError(404, 'No se encontró la vacante solicitada.', 'VACANTE_NO_ENCONTRADA');
  }
  if (vacante.estado !== 'activa') {
    throw new ApiError(409, 'La vacante no está disponible para recibir postulaciones.', 'VACANTE_NO_DISPONIBLE');
  }

  let puntajeMatch: number | undefined;
  try {
    puntajeMatch = await calcularPuntajeMatch(candidato.id_candidato, vacante.id_vacante);
  } catch (error) {
    logger.warn({ error, id_candidato: candidato.id_candidato, id_vacante: vacante.id_vacante }, 'No se pudo calcular el puntaje de compatibilidad');
  }

  try {
    const postulacion = await prisma.postulacion.create({
      data: {
        id_candidato: candidato.id_candidato,
        id_vacante: vacante.id_vacante,
        ...(puntajeMatch !== undefined ? { puntaje_match: new Prisma.Decimal(puntajeMatch.toFixed(2)) } : {}),
      },
      include: incluirPostulacion,
    });
    return mapearPostulacionCandidato(postulacion);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ApiError(409, 'Ya te postulaste a esta vacante.', 'YA_POSTULADO');
    }
    throw error;
  }
}

export async function cambiarEstado(id: number, datos: CambiarEstadoInput, solicitante: UsuarioSolicitante): Promise<PostulacionCandidatoRespuesta> {
  const postulacion = await prisma.postulacion.findUnique({
    where: { id_postulacion: id },
    include: { vacante: { include: { empresa: { select: { id_empresa: true, id_usuario: true } } } } },
  });
  if (!postulacion) {
    throw new ApiError(404, 'No se encontró la postulación solicitada.', 'POSTULACION_NO_ENCONTRADA');
  }

  if (solicitante.tipo !== 'admin') {
    const empresa = await prisma.empresa.findUnique({ where: { id_usuario: solicitante.id_usuario } });
    if (!empresa || empresa.id_empresa !== postulacion.vacante.id_empresa) {
      throw new ApiError(403, 'Solo la empresa dueña de la vacante puede actualizar el estado de una postulación.', 'PERMISO_DENEGADO');
    }
  }

  if (postulacion.estado === 'contratada' || postulacion.estado === 'rechazada') {
    throw new ApiError(409, 'Esta postulación ya está cerrada y no admite cambios de estado.', 'TRANSICION_INVALIDA');
  }
  if (postulacion.estado === datos.estado) {
    throw new ApiError(409, 'La postulación ya se encuentra en ese estado.', 'TRANSICION_INVALIDA');
  }

  const actualizada = await prisma.postulacion.update({
    where: { id_postulacion: id },
    data: { estado: datos.estado },
    include: incluirPostulacion,
  });

  return mapearPostulacionCandidato(actualizada);
}

export async function postulacionesDeCandidato(
  idCandidato: number,
  filtros: ListarPostulacionesCandidatoQuery,
  solicitante: UsuarioSolicitante,
): Promise<ListadoPostulaciones> {
  const candidato = await prisma.candidato.findUnique({ where: { id_candidato: idCandidato } });
  if (!candidato) {
    throw new ApiError(404, 'No se encontró el perfil de candidato solicitado.', 'CANDIDATO_NO_ENCONTRADO');
  }
  if (solicitante.tipo !== 'admin' && solicitante.id_usuario !== candidato.id_usuario) {
    throw new ApiError(403, 'No tienes permiso para ver estas postulaciones.', 'PERMISO_DENEGADO');
  }

  const page = filtros.page;
  const limit = filtros.limit;
  const where = { id_candidato: idCandidato, ...(filtros.estado ? { estado: filtros.estado } : {}) };

  const [total, postulaciones] = await Promise.all([
    prisma.postulacion.count({ where }),
    prisma.postulacion.findMany({
      where,
      include: incluirPostulacion,
      orderBy: { fecha_postulacion: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { total, page, limit, data: postulaciones.map(mapearPostulacionCandidato) };
}

export async function postulacionesRecibidasDeEmpresa(
  idEmpresa: number,
  filtros: ListarPostulacionesRecibidasQuery,
  solicitante: UsuarioSolicitante,
): Promise<ListadoPostulacionesRecibidas> {
  const empresa = await prisma.empresa.findUnique({ where: { id_empresa: idEmpresa } });
  if (!empresa) {
    throw new ApiError(404, 'No se encontró el perfil de empresa solicitado.', 'EMPRESA_NO_ENCONTRADA');
  }
  if (solicitante.tipo !== 'admin' && solicitante.id_usuario !== empresa.id_usuario) {
    throw new ApiError(403, 'No tienes permiso para ver estas postulaciones.', 'PERMISO_DENEGADO');
  }

  const page = filtros.page;
  const limit = filtros.limit;
  const where: Prisma.PostulacionWhereInput = {
    ...(filtros.estado ? { estado: filtros.estado } : {}),
    vacante: {
      id_empresa: idEmpresa,
      ...(filtros.id_vacante ? { id_vacante: filtros.id_vacante } : {}),
    },
  };

  const [total, postulaciones, porEstado] = await Promise.all([
    prisma.postulacion.count({ where }),
    prisma.postulacion.findMany({
      where,
      include: incluirPostulacionRecibida,
      orderBy: { fecha_postulacion: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.postulacion.groupBy({ by: ['estado'], where, _count: true }),
  ]);

  const resumenPorEstado: Record<string, number> = { enviada: 0, en_revision: 0, entrevista: 0, rechazada: 0, contratada: 0 };
  for (const grupo of porEstado) {
    resumenPorEstado[grupo.estado] = grupo._count;
  }

  return {
    total,
    page,
    limit,
    data: postulaciones.map(mapearPostulacionRecibida),
    resumen: { por_estado: resumenPorEstado },
  };
}