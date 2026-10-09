import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { ApiError } from '../shared/ApiError.js';
import type {
  ActualizarUsuarioAdminInput,
  ListarEmpresasAdminQuery,
  ListarUsuariosAdminQuery,
} from '../schemas/admin.schemas.js';

export interface EstadisticasAdmin {
  usuarios: {
    total: number;
    candidatos: number;
    empresas: number;
    mentores: number;
    admins: number;
    activos: number;
    inactivos: number;
  };
  vacantes: {
    total: number;
    activas: number;
  };
  postulaciones: { total: number };
  sellos: {
    pendientes: number;
    aprobados: number;
    rechazados: number;
  };
}

export interface UsuarioAdmin {
  id_usuario: number;
  correo: string;
  tipo_usuario: string;
  activo: boolean;
  fecha_registro: Date;
  nombre: string | null;
}

export interface ListadoUsuariosAdmin {
  total: number;
  page: number;
  limit: number;
  data: UsuarioAdmin[];
}

export interface EmpresaAdmin {
  id_empresa: number;
  nombre_empresa: string;
  correo: string;
  ubicacion: string | null;
  logo_url: string | null;
  fecha_creacion: Date;
  sello_estado: string | null;
  sello_nivel: string | null;
  total_vacantes: number;
}

export interface ListadoEmpresasAdmin {
  total: number;
  page: number;
  limit: number;
  data: EmpresaAdmin[];
}

const incluirUsuarioAdmin = {
  candidato: { select: { nombre_completo: true } },
  empresa: { select: { nombre_empresa: true } },
} satisfies Prisma.UsuarioInclude;

type UsuarioConPerfil = Prisma.UsuarioGetPayload<{ include: typeof incluirUsuarioAdmin }>;

function mapearUsuario(usuario: UsuarioConPerfil): UsuarioAdmin {
  return {
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    tipo_usuario: usuario.tipo_usuario,
    activo: usuario.activo,
    fecha_registro: usuario.fecha_registro,
    nombre: usuario.candidato?.nombre_completo ?? usuario.empresa?.nombre_empresa ?? null,
  };
}

export async function obtenerEstadisticas(): Promise<EstadisticasAdmin> {
  const [
    totalUsuarios,
    candidatos,
    empresas,
    mentores,
    admins,
    activos,
    totalVacantes,
    vacantesActivas,
    totalPostulaciones,
    sellosPendientes,
    sellosAprobados,
    sellosRechazados,
  ] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { tipo_usuario: 'candidato' } }),
    prisma.usuario.count({ where: { tipo_usuario: 'empresa' } }),
    prisma.usuario.count({ where: { tipo_usuario: 'mentor' } }),
    prisma.usuario.count({ where: { tipo_usuario: 'admin' } }),
    prisma.usuario.count({ where: { activo: true } }),
    prisma.vacante.count(),
    prisma.vacante.count({ where: { estado: 'activa' } }),
    prisma.postulacion.count(),
    prisma.selloInclusion.count({ where: { estado: 'pendiente' } }),
    prisma.selloInclusion.count({ where: { estado: 'aprobado' } }),
    prisma.selloInclusion.count({ where: { estado: 'rechazado' } }),
  ]);

  return {
    usuarios: {
      total: totalUsuarios,
      candidatos,
      empresas,
      mentores,
      admins,
      activos,
      inactivos: totalUsuarios - activos,
    },
    vacantes: { total: totalVacantes, activas: vacantesActivas },
    postulaciones: { total: totalPostulaciones },
    sellos: { pendientes: sellosPendientes, aprobados: sellosAprobados, rechazados: sellosRechazados },
  };
}

export async function listarUsuarios(filtros: ListarUsuariosAdminQuery): Promise<ListadoUsuariosAdmin> {
  const where: Prisma.UsuarioWhereInput = {};

  if (filtros.tipo) {
    where.tipo_usuario = filtros.tipo;
  }
  if (filtros.activo !== undefined) {
    where.activo = filtros.activo === 'true';
  }
  if (filtros.busqueda) {
    where.correo = { contains: filtros.busqueda };
  }

  const [total, usuarios] = await Promise.all([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where,
      include: incluirUsuarioAdmin,
      orderBy: { id_usuario: 'desc' },
      skip: (filtros.page - 1) * filtros.limit,
      take: filtros.limit,
    }),
  ]);

  return {
    total,
    page: filtros.page,
    limit: filtros.limit,
    data: usuarios.map(mapearUsuario),
  };
}

export async function actualizarUsuario(
  idUsuario: number,
  datos: ActualizarUsuarioAdminInput,
  solicitante: { id_usuario: number },
): Promise<UsuarioAdmin> {
  const usuario = await prisma.usuario.findUnique({ where: { id_usuario: idUsuario } });
  if (!usuario) {
    throw new ApiError(404, 'No se encontró el usuario solicitado.', 'USUARIO_NO_ENCONTRADO');
  }

  if (datos.activo === false && usuario.id_usuario === solicitante.id_usuario) {
    throw new ApiError(409, 'No puedes desactivar tu propia cuenta de administrador.', 'ACCION_INVALIDA');
  }

  const actualizado = await prisma.usuario.update({
    where: { id_usuario: idUsuario },
    data: { activo: datos.activo },
    include: incluirUsuarioAdmin,
  });

  return mapearUsuario(actualizado);
}

const incluirEmpresaAdmin = {
  usuario: { select: { correo: true } },
  sello: { select: { estado: true, nivel: true } },
  _count: { select: { vacantes: true } },
} satisfies Prisma.EmpresaInclude;

type EmpresaConDatos = Prisma.EmpresaGetPayload<{ include: typeof incluirEmpresaAdmin }>;

function mapearEmpresa(empresa: EmpresaConDatos): EmpresaAdmin {
  return {
    id_empresa: empresa.id_empresa,
    nombre_empresa: empresa.nombre_empresa,
    correo: empresa.usuario.correo,
    ubicacion: empresa.ubicacion,
    logo_url: empresa.logo_url,
    fecha_creacion: empresa.fecha_creacion,
    sello_estado: empresa.sello?.estado ?? null,
    sello_nivel: empresa.sello?.nivel ?? null,
    total_vacantes: empresa._count.vacantes,
  };
}

export async function listarEmpresas(filtros: ListarEmpresasAdminQuery): Promise<ListadoEmpresasAdmin> {
  const where: Prisma.EmpresaWhereInput = {};

  if (filtros.busqueda) {
    where.OR = [
      { nombre_empresa: { contains: filtros.busqueda } },
      { usuario: { correo: { contains: filtros.busqueda } } },
    ];
  }
  if (filtros.sello === 'sin_sello') {
    where.sello = { is: null };
  } else if (filtros.sello) {
    where.sello = { is: { estado: filtros.sello } };
  }

  const [total, empresas] = await Promise.all([
    prisma.empresa.count({ where }),
    prisma.empresa.findMany({
      where,
      include: incluirEmpresaAdmin,
      orderBy: { id_empresa: 'desc' },
      skip: (filtros.page - 1) * filtros.limit,
      take: filtros.limit,
    }),
  ]);

  return {
    total,
    page: filtros.page,
    limit: filtros.limit,
    data: empresas.map(mapearEmpresa),
  };
}
