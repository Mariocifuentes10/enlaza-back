import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { ApiError } from '../shared/ApiError.js';
import type { DatosActualizarEmpresa } from '../schemas/empresas.schemas.js';
import type { UsuarioSolicitante } from './candidatos.service.js';

export interface SelloEmpresa {
  id_sello: number;
  nivel: string;
  estado: string;
  fecha_verificacion: Date | null;
  evidencia_url: string | null;
  motivo_rechazo: string | null;
}

export interface PerfilEmpresa {
  id_empresa: number;
  id_usuario: number;
  correo: string;
  nombre_empresa: string;
  descripcion: string | null;
  sitio_web: string | null;
  ubicacion: string | null;
  logo_url: string | null;
  fecha_creacion: Date;
  sello: SelloEmpresa | null;
}

const incluirPerfilEmpresa = {
  usuario: { select: { correo: true } },
  sello: true,
} satisfies Prisma.EmpresaInclude;

const mapearEmpresa = (empresa: Prisma.EmpresaGetPayload<{ include: typeof incluirPerfilEmpresa }>): PerfilEmpresa => ({
  id_empresa: empresa.id_empresa,
  id_usuario: empresa.id_usuario,
  correo: empresa.usuario.correo,
  nombre_empresa: empresa.nombre_empresa,
  descripcion: empresa.descripcion,
  sitio_web: empresa.sitio_web,
  ubicacion: empresa.ubicacion,
  logo_url: empresa.logo_url,
  fecha_creacion: empresa.fecha_creacion,
  sello: empresa.sello
    ? {
        id_sello: empresa.sello.id_sello,
        nivel: empresa.sello.nivel,
        estado: empresa.sello.estado,
        fecha_verificacion: empresa.sello.fecha_verificacion,
        evidencia_url: empresa.sello.evidencia_url,
        motivo_rechazo: empresa.sello.motivo_rechazo,
      }
    : null,
});

function verificarAcceso(idUsuario: number, solicitante: UsuarioSolicitante): void {
  if (solicitante.id_usuario !== idUsuario && solicitante.tipo !== 'admin') {
    throw new ApiError(403, 'No tienes permiso para ver o editar este perfil.', 'PERMISO_DENEGADO');
  }
}

export async function resumenPublico(id: number): Promise<PerfilEmpresa> {
  const empresa = await prisma.empresa.findUnique({
    where: { id_empresa: id },
    include: incluirPerfilEmpresa,
  });

  if (!empresa) {
    throw new ApiError(404, 'No se encontró el perfil de empresa solicitado.', 'EMPRESA_NO_ENCONTRADA');
  }

  const perfil = mapearEmpresa(empresa);
  const { correo: _correo, id_usuario: _id_usuario, ...resumen } = perfil;
  return resumen;
}

export async function obtener(id: number, solicitante: UsuarioSolicitante): Promise<PerfilEmpresa> {
  const empresa = await prisma.empresa.findUnique({
    where: { id_empresa: id },
    include: incluirPerfilEmpresa,
  });

  if (!empresa) {
    throw new ApiError(404, 'No se encontró el perfil de empresa solicitado.', 'EMPRESA_NO_ENCONTRADA');
  }

  verificarAcceso(empresa.id_usuario, solicitante);
  return mapearEmpresa(empresa);
}

export async function actualizar(
  id: number,
  datos: DatosActualizarEmpresa,
  solicitante: UsuarioSolicitante,
): Promise<PerfilEmpresa> {
  const existente = await prisma.empresa.findUnique({ where: { id_empresa: id } });
  if (!existente) {
    throw new ApiError(404, 'No se encontró el perfil de empresa solicitado.', 'EMPRESA_NO_ENCONTRADA');
  }

  verificarAcceso(existente.id_usuario, solicitante);

  await prisma.empresa.update({ where: { id_empresa: id }, data: datos });
  return obtener(id, solicitante);
}