import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { ApiError } from '../shared/ApiError.js';
import type { UsuarioSolicitante } from './candidatos.service.js';
import type { RevisarSelloInput, SolicitarSelloInput } from '../schemas/sello.schemas.js';

export interface SelloRespuesta {
  id_sello: number;
  id_empresa: number;
  nivel: string;
  estado: string;
  fecha_verificacion: Date | null;
  verificado_por: number | null;
  evidencia_url: string | null;
  motivo_rechazo: string | null;
}

export interface SolicitudSelloAdmin extends SelloRespuesta {
  empresa: { id_empresa: number; nombre_empresa: string; ubicacion: string | null; logo_url: string | null };
}

export interface ListadoSolicitudes {
  total: number;
  data: SolicitudSelloAdmin[];
}

const incluirSelloConEmpresa = {
  empresa: { select: { id_empresa: true, nombre_empresa: true, ubicacion: true, logo_url: true } },
} satisfies Prisma.SelloInclusionInclude;

type SelloConEmpresa = Prisma.SelloInclusionGetPayload<{ include: typeof incluirSelloConEmpresa }>;

function mapearSelloConEmpresa(sello: SelloConEmpresa): SolicitudSelloAdmin {
  return {
    id_sello: sello.id_sello,
    id_empresa: sello.id_empresa,
    nivel: sello.nivel,
    estado: sello.estado,
    fecha_verificacion: sello.fecha_verificacion,
    verificado_por: sello.verificado_por,
    evidencia_url: sello.evidencia_url,
    motivo_rechazo: sello.motivo_rechazo,
    empresa: sello.empresa,
  };
}

async function cargarEmpresaYVerificarAcceso(idEmpresa: number, solicitante: UsuarioSolicitante) {
  const empresa = await prisma.empresa.findUnique({ where: { id_empresa: idEmpresa } });
  if (!empresa) {
    throw new ApiError(404, 'No se encontró el perfil de empresa solicitado.', 'EMPRESA_NO_ENCONTRADA');
  }
  if (solicitante.tipo !== 'admin' && empresa.id_usuario !== solicitante.id_usuario) {
    throw new ApiError(403, 'Solo la empresa dueña puede solicitar su sello de inclusión.', 'PERMISO_DENEGADO');
  }
  return empresa;
}

export async function solicitar(
  idEmpresa: number,
  datos: SolicitarSelloInput,
  solicitante: UsuarioSolicitante,
): Promise<SelloRespuesta> {
  await cargarEmpresaYVerificarAcceso(idEmpresa, solicitante);

  const existente = await prisma.selloInclusion.findUnique({ where: { id_empresa: idEmpresa } });
  if (existente) {
    if (existente.estado === 'aprobado') {
      throw new ApiError(409, 'La empresa ya cuenta con el sello de inclusión aprobado.', 'SELLO_YA_APROBADO');
    }
    if (existente.estado === 'pendiente') {
      throw new ApiError(409, 'Ya existe una solicitud de sello en revisión.', 'SELLO_EN_REVISION');
    }
  }

  const sello = await prisma.selloInclusion.upsert({
    where: { id_empresa: idEmpresa },
    update: {
      nivel: datos.nivel ?? 'basico',
      evidencia_url: datos.evidencia_url,
      estado: 'pendiente',
      motivo_rechazo: null,
      fecha_verificacion: null,
      verificado_por: null,
    },
    create: {
      id_empresa: idEmpresa,
      nivel: datos.nivel ?? 'basico',
      evidencia_url: datos.evidencia_url,
    },
    include: incluirSelloConEmpresa,
  });

  return mapearSelloConEmpresa(sello);
}

export async function listarSolicitudes(
  filtros: { estado?: string },
  solicitante: UsuarioSolicitante,
): Promise<ListadoSolicitudes> {
  if (solicitante.tipo !== 'admin') {
    throw new ApiError(403, 'Solo el administrador puede revisar solicitudes de sello.', 'PERMISO_DENEGADO');
  }

  const where = filtros.estado ? { estado: filtros.estado as Prisma.SelloInclusionWhereInput['estado'] } : {};

  const [total, solicitudes] = await Promise.all([
    prisma.selloInclusion.count({ where }),
    prisma.selloInclusion.findMany({
      where,
      include: incluirSelloConEmpresa,
      orderBy: { id_sello: 'asc' },
    }),
  ]);

  return { total, data: solicitudes.map(mapearSelloConEmpresa) };
}

export async function revisar(
  idSello: number,
  datos: RevisarSelloInput,
  solicitante: UsuarioSolicitante,
): Promise<SelloRespuesta> {
  if (solicitante.tipo !== 'admin') {
    throw new ApiError(403, 'Solo el administrador puede aprobar o rechazar el sello.', 'PERMISO_DENEGADO');
  }

  const sello = await prisma.selloInclusion.findUnique({ where: { id_sello: idSello } });
  if (!sello) {
    throw new ApiError(404, 'No se encontró la solicitud de sello indicada.', 'SELLO_NO_ENCONTRADO');
  }
  if (sello.estado === 'aprobado') {
    throw new ApiError(409, 'El sello ya fue aprobado previamente.', 'SELLO_YA_APROBADO');
  }

  const actualizado = await prisma.selloInclusion.update({
    where: { id_sello: idSello },
    data: {
      estado: datos.estado,
      fecha_verificacion: new Date(),
      verificado_por: solicitante.id_usuario,
      motivo_rechazo: datos.estado === 'rechazado' ? (datos.motivo_rechazo ?? null) : null,
    },
    include: incluirSelloConEmpresa,
  });

  return mapearSelloConEmpresa(actualizado);
}