import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../shared/ApiError.js';
import type { UsuarioSolicitante } from './candidatos.service.js';
import { generarEmbeddingVacante } from './ai/matching.service.js';
import { analizarLenguaje } from './ai/bias-detector.service.js';
import type { ActualizarVacanteInput, BuscarVacantesQuery, CrearVacanteInput, ListarVacantesQuery } from '../schemas/vacantes.schemas.js';

export interface AjusteVacanteRespuesta {
  id_ajuste: number;
  nombre_ajuste: string;
  descripcion: string | null;
}

export interface EmpresaVacanteRespuesta {
  id_empresa: number;
  nombre_empresa: string;
  logo_url: string | null;
  ubicacion: string | null;
  sello: { nivel: string; estado: string } | null;
}

export interface VacanteRespuesta {
  id_vacante: number;
  id_empresa: number;
  titulo: string;
  descripcion: string;
  modalidad: string;
  ubicacion: string | null;
  salario_min: number | null;
  salario_max: number | null;
  fecha_publicacion: Date;
  fecha_cierre: Date | null;
  estado: string;
  alerta_lenguaje: boolean;
  ajustes: AjusteVacanteRespuesta[];
  empresa: EmpresaVacanteRespuesta;
}

export interface ListadoVacantes {
  total: number;
  page: number;
  limit: number;
  data: VacanteRespuesta[];
}

export const incluirVacante = {
  ajustes: {
    select: {
      ajuste: { select: { id_ajuste: true, nombre_ajuste: true, descripcion: true } },
    },
  },
  empresa: {
    select: {
      id_empresa: true,
      nombre_empresa: true,
      logo_url: true,
      ubicacion: true,
      sello: { select: { nivel: true, estado: true } },
    },
  },
} satisfies Prisma.VacanteInclude;

type VacanteConIncluidos = Prisma.VacanteGetPayload<{ include: typeof incluirVacante }>;

function convertirSalario(salario: Prisma.Decimal | null): number | null {
  return salario == null ? null : Number(salario);
}

export const mapearVacante = (vacante: VacanteConIncluidos): VacanteRespuesta => ({
  id_vacante: vacante.id_vacante,
  id_empresa: vacante.id_empresa,
  titulo: vacante.titulo,
  descripcion: vacante.descripcion,
  modalidad: vacante.modalidad,
  ubicacion: vacante.ubicacion,
  salario_min: convertirSalario(vacante.salario_min),
  salario_max: convertirSalario(vacante.salario_max),
  fecha_publicacion: vacante.fecha_publicacion,
  fecha_cierre: vacante.fecha_cierre,
  estado: vacante.estado,
  alerta_lenguaje: vacante.alerta_lenguaje,
  ajustes: vacante.ajustes.map((av) => ({
    id_ajuste: av.ajuste.id_ajuste,
    nombre_ajuste: av.ajuste.nombre_ajuste,
    descripcion: av.ajuste.descripcion,
  })),
  empresa: {
    id_empresa: vacante.empresa.id_empresa,
    nombre_empresa: vacante.empresa.nombre_empresa,
    logo_url: vacante.empresa.logo_url,
    ubicacion: vacante.empresa.ubicacion,
    sello: vacante.empresa.sello
      ? { nivel: vacante.empresa.sello.nivel, estado: vacante.empresa.sello.estado }
      : null,
  },
});

async function resolverEmpresaSolicitante(solicitante: UsuarioSolicitante): Promise<number> {
  if (solicitante.tipo === 'admin') {
    throw new ApiError(403, 'Las vacantes deben crearse desde la cuenta de una empresa.', 'EMPRESA_REQUERIDA');
  }

  const empresa = await prisma.empresa.findUnique({ where: { id_usuario: solicitante.id_usuario } });
  if (!empresa) {
    throw new ApiError(403, 'Se necesita una cuenta de empresa para gestionar vacantes.', 'EMPRESA_REQUERIDA');
  }
  return empresa.id_empresa;
}

async function cargarYVerificarPropietario(id: number, solicitante: UsuarioSolicitante): Promise<VacanteConIncluidos> {
  const vacante = await prisma.vacante.findUnique({ where: { id_vacante: id }, include: incluirVacante });
  if (!vacante) {
    throw new ApiError(404, 'No se encontró la vacante solicitada.', 'VACANTE_NO_ENCONTRADA');
  }

  if (solicitante.tipo !== 'admin') {
    const empresa = await prisma.empresa.findUnique({ where: { id_usuario: solicitante.id_usuario } });
    if (!empresa || empresa.id_empresa !== vacante.id_empresa) {
      throw new ApiError(403, 'No tienes permiso para gestionar esta vacante.', 'PERMISO_DENEGADO');
    }
  }

  return vacante;
}

async function validarAjustes(ids: number[]): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  const encontrados = await prisma.tipoAjuste.count({ where: { id_ajuste: { in: ids } } });
  if (encontrados !== ids.length) {
    throw new ApiError(422, 'Algunos de los ajustes ofrecidos no existen.', 'AJUSTES_INVALIDOS');
  }
}

export async function crear(datos: CrearVacanteInput, solicitante: UsuarioSolicitante): Promise<VacanteRespuesta> {
  const idEmpresa = await resolverEmpresaSolicitante(solicitante);
  const idsAjustes = datos.ajustes ?? [];
  await validarAjustes(idsAjustes);

  const { ajustes: _ajustes, ...campos } = datos;
  const vacante = await prisma.vacante.create({
    data: {
      id_empresa: idEmpresa,
      ...campos,
      ajustes: { create: idsAjustes.map((id_ajuste) => ({ id_ajuste })) },
    },
    include: incluirVacante,
  });

  void generarEmbeddingVacante(vacante.id_vacante).catch((error) => {
    logger.warn({ error, id_vacante: vacante.id_vacante }, 'No se pudo generar el embedding de la vacante');
  });

  void analizarLenguaje(vacante.id_vacante).catch((error) => {
    logger.warn({ error, id_vacante: vacante.id_vacante }, 'No se pudo analizar el lenguaje de la vacante');
  });

  return mapearVacante(vacante);
}

export async function listar(filtros: ListarVacantesQuery): Promise<ListadoVacantes> {
  const page = filtros.page;
  const limit = filtros.limit;

  const [total, vacantes] = await Promise.all([
    prisma.vacante.count({ where: { estado: filtros.estado } }),
    prisma.vacante.findMany({
      where: { estado: filtros.estado },
      include: incluirVacante,
      orderBy: { fecha_publicacion: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { total, page, limit, data: vacantes.map(mapearVacante) };
}

export async function obtener(id: number): Promise<VacanteRespuesta> {
  const vacante = await prisma.vacante.findUnique({ where: { id_vacante: id }, include: incluirVacante });
  if (!vacante) {
    throw new ApiError(404, 'No se encontró la vacante solicitada.', 'VACANTE_NO_ENCONTRADA');
  }
  return mapearVacante(vacante);
}

export async function actualizar(
  id: number,
  datos: ActualizarVacanteInput,
  solicitante: UsuarioSolicitante,
): Promise<VacanteRespuesta> {
  await cargarYVerificarPropietario(id, solicitante);

  const idsAjustes = datos.ajustes;
  if (idsAjustes !== undefined) {
    await validarAjustes(idsAjustes);
  }

  const { ajustes, ...campos } = datos;

  await prisma.$transaction(async (tx) => {
    if (ajustes !== undefined) {
      await tx.ajusteVacante.deleteMany({ where: { id_vacante: id } });
      await tx.ajusteVacante.createMany({ data: ajustes.map((id_ajuste) => ({ id_vacante: id, id_ajuste })) });
    }
    await tx.vacante.update({ where: { id_vacante: id }, data: campos });
  });

  const vacanteActualizada = await obtener(id);
  void generarEmbeddingVacante(id).catch((error) => {
    logger.warn({ error, id_vacante: id }, 'No se pudo regenerar el embedding de la vacante');
  });

  void analizarLenguaje(id).catch((error) => {
    logger.warn({ error, id_vacante: id }, 'No se pudo re-analizar el lenguaje de la vacante');
  });

  return vacanteActualizada;
}

export async function eliminar(id: number, solicitante: UsuarioSolicitante): Promise<{ id_vacante: number }> {
  await cargarYVerificarPropietario(id, solicitante);
  await prisma.vacante.delete({ where: { id_vacante: id } });
  return { id_vacante: id };
}

interface ConsultaIds {
  ids: number[];
  total: number;
}

async function consultarIds(where: Prisma.Sql, orden: Prisma.Sql, limit: number, offset: number, totalSql: Prisma.Sql): Promise<ConsultaIds> {
  const [filas, conteo] = await Promise.all([
    prisma.$queryRaw<Array<{ id_vacante: number }>>(Prisma.sql`
      SELECT v.id_vacante
      FROM vacantes v
      WHERE ${where}
      ${orden}
      LIMIT ${limit} OFFSET ${offset}
    `),
    prisma.$queryRaw<Array<{ total: bigint }>>(totalSql),
  ]);

  return { ids: filas.map((fila) => fila.id_vacante), total: Number(conteo[0]?.total ?? 0) };
}

export async function buscar(filtros: BuscarVacantesQuery): Promise<ListadoVacantes> {
  const texto = filtros.texto?.trim();
  const page = filtros.page;
  const limit = filtros.limit;
  const offset = (page - 1) * limit;
  const usarFullText = texto !== undefined && texto.length >= 3;

  const condiciones: Prisma.Sql[] = [Prisma.sql`v.estado = 'activa'`];
  if (filtros.ubicacion) {
    condiciones.push(Prisma.sql`v.ubicacion LIKE ${`%${filtros.ubicacion}%`}`);
  }
  if (filtros.modalidad) {
    condiciones.push(Prisma.sql`v.modalidad = ${filtros.modalidad}`);
  }

  if (usarFullText && texto) {
    const conFullText = [...condiciones, Prisma.sql`MATCH (v.titulo, v.descripcion) AGAINST (${texto} IN NATURAL LANGUAGE MODE)`];
    const whereFullText = Prisma.join(conFullText, ' AND ');
    const ordenFullText = Prisma.sql`ORDER BY MATCH (v.titulo, v.descripcion) AGAINST (${texto} IN NATURAL LANGUAGE MODE) DESC`;
    const dondeFullText = Prisma.sql`SELECT COUNT(*) AS total FROM vacantes v WHERE ${whereFullText}`;
    const resultado = await consultarIds(whereFullText, ordenFullText, limit, offset, dondeFullText);

    if (resultado.ids.length > 0) {
      return await hidratarEnOrden(resultado, limit, page);
    }

    const like = `%${texto}%`;
    const conLike = [...condiciones, Prisma.sql`(v.titulo LIKE ${like} OR v.descripcion LIKE ${like})`];
    const whereLike = Prisma.join(conLike, ' AND ');
    const dondeLike = Prisma.sql`SELECT COUNT(*) AS total FROM vacantes v WHERE ${whereLike}`;
    const resultadoLike = await consultarIds(whereLike, Prisma.empty, limit, offset, dondeLike);
    return await hidratarEnOrden(resultadoLike, limit, page);
  }

  const whereFinal = Prisma.join(condiciones, ' AND ');
  const ordenSimple = Prisma.sql`ORDER BY v.fecha_publicacion DESC`;
  const dondeFinal = Prisma.sql`SELECT COUNT(*) AS total FROM vacantes v WHERE ${whereFinal}`;
  const resultadoFinal = await consultarIds(whereFinal, ordenSimple, limit, offset, dondeFinal);
  return await hidratarEnOrden(resultadoFinal, limit, page);
}

async function hidratarEnOrden(resultado: ConsultaIds, limit: number, page: number): Promise<ListadoVacantes> {
  if (resultado.ids.length === 0) {
    return { total: resultado.total, page, limit, data: [] };
  }

  const vacantes = await prisma.vacante.findMany({
    where: { id_vacante: { in: resultado.ids } },
    include: incluirVacante,
  });

  const porId = new Map(vacantes.map((v) => [v.id_vacante, v]));
  const data = resultado.ids.map((id) => porId.get(id)).filter((v): v is NonNullable<typeof v> => v !== undefined).map(mapearVacante);

  return { total: resultado.total, page, limit, data };
}