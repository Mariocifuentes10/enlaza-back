import { prisma } from '../config/db.js';
import { ApiError } from '../shared/ApiError.js';
import type { CrearHabilidadInput, CrearTipoAjusteInput } from '../schemas/catalogos.schemas.js';

export interface HabilidadCatalogo {
  id_habilidad: number;
  nombre_habilidad: string;
  categoria: string | null;
}

export interface TipoAjusteCatalogo {
  id_ajuste: number;
  nombre_ajuste: string;
  descripcion: string | null;
}

export async function listarHabilidades(categoria?: string): Promise<HabilidadCatalogo[]> {
  const habilidades = await prisma.habilidad.findMany({
    where: categoria ? { categoria } : undefined,
    orderBy: { nombre_habilidad: 'asc' },
    select: { id_habilidad: true, nombre_habilidad: true, categoria: true },
  });
  return habilidades;
}

export async function crearHabilidad(datos: CrearHabilidadInput): Promise<HabilidadCatalogo> {
  const existente = await prisma.habilidad.findUnique({ where: { nombre_habilidad: datos.nombre_habilidad } });
  if (existente) {
    throw new ApiError(409, 'Esa habilidad ya está registrada en el catálogo.', 'HABILIDAD_EXISTENTE');
  }
  return prisma.habilidad.create({ data: datos });
}

export async function eliminarHabilidad(id: number): Promise<{ id_habilidad: number }> {
  const existente = await prisma.habilidad.findUnique({ where: { id_habilidad: id } });
  if (!existente) {
    throw new ApiError(404, 'No se encontró la habilidad solicitada.', 'HABILIDAD_NO_ENCONTRADA');
  }
  await prisma.habilidad.delete({ where: { id_habilidad: id } });
  return { id_habilidad: id };
}

export async function listarTiposAjuste(): Promise<TipoAjusteCatalogo[]> {
  return prisma.tipoAjuste.findMany({
    orderBy: { nombre_ajuste: 'asc' },
    select: { id_ajuste: true, nombre_ajuste: true, descripcion: true },
  });
}

export async function crearTipoAjuste(datos: CrearTipoAjusteInput): Promise<TipoAjusteCatalogo> {
  const existente = await prisma.tipoAjuste.findFirst({ where: { nombre_ajuste: datos.nombre_ajuste } });
  if (existente) {
    throw new ApiError(409, 'Ese tipo de ajuste ya está registrado en el catálogo.', 'AJUSTE_EXISTENTE');
  }
  return prisma.tipoAjuste.create({ data: datos });
}

export async function eliminarTipoAjuste(id: number): Promise<{ id_ajuste: number }> {
  const existente = await prisma.tipoAjuste.findUnique({ where: { id_ajuste: id } });
  if (!existente) {
    throw new ApiError(404, 'No se encontró el tipo de ajuste solicitado.', 'AJUSTE_NO_ENCONTRADO');
  }
  await prisma.tipoAjuste.delete({ where: { id_ajuste: id } });
  return { id_ajuste: id };
}