import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { ApiError } from '../shared/ApiError.js';
import type { DatosActualizarCandidato } from '../schemas/candidatos.schemas.js';

export interface UsuarioSolicitante {
  id_usuario: number;
  tipo: string;
}

export interface HabilidadPerfilCandidato {
  id_habilidad: number;
  nombre_habilidad: string;
  categoria: string | null;
  nivel: string;
}

export interface AjustePerfilCandidato {
  id_ajuste: number;
  nombre_ajuste: string;
}

export interface PerfilCandidato {
  id_candidato: number;
  id_usuario: number;
  correo: string;
  nombre_completo: string;
  telefono: string | null;
  ubicacion: string | null;
  resumen_perfil: string | null;
  tipo_discapacidad: string | null;
  visible_discapacidad: boolean;
  cv_url: string | null;
  fecha_creacion: Date;
  habilidades: HabilidadPerfilCandidato[];
  ajustes: AjustePerfilCandidato[];
}

const incluirPerfilCandidato = {
  usuario: { select: { correo: true } },
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
} satisfies Prisma.CandidatoInclude;

const mapearCandidato = (candidato: Prisma.CandidatoGetPayload<{ include: typeof incluirPerfilCandidato }>): PerfilCandidato => ({
  id_candidato: candidato.id_candidato,
  id_usuario: candidato.id_usuario,
  correo: candidato.usuario.correo,
  nombre_completo: candidato.nombre_completo,
  telefono: candidato.telefono,
  ubicacion: candidato.ubicacion,
  resumen_perfil: candidato.resumen_perfil,
  tipo_discapacidad: candidato.tipo_discapacidad,
  visible_discapacidad: candidato.visible_discapacidad,
  cv_url: candidato.cv_url,
  fecha_creacion: candidato.fecha_creacion,
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
});

function verificarAcceso(idUsuario: number, solicitante: UsuarioSolicitante): void {
  if (solicitante.id_usuario !== idUsuario && solicitante.tipo !== 'admin') {
    throw new ApiError(403, 'No tienes permiso para ver o editar este perfil.', 'PERMISO_DENEGADO');
  }
}

export async function obtener(id: number, solicitante: UsuarioSolicitante): Promise<PerfilCandidato> {
  const candidato = await prisma.candidato.findUnique({
    where: { id_candidato: id },
    include: incluirPerfilCandidato,
  });

  if (!candidato) {
    throw new ApiError(404, 'No se encontró el perfil de candidato solicitado.', 'CANDIDATO_NO_ENCONTRADO');
  }

  verificarAcceso(candidato.id_usuario, solicitante);
  return mapearCandidato(candidato);
}

export async function actualizar(
  id: number,
  datos: DatosActualizarCandidato,
  solicitante: UsuarioSolicitante,
): Promise<PerfilCandidato> {
  const existente = await prisma.candidato.findUnique({ where: { id_candidato: id } });
  if (!existente) {
    throw new ApiError(404, 'No se encontró el perfil de candidato solicitado.', 'CANDIDATO_NO_ENCONTRADO');
  }

  verificarAcceso(existente.id_usuario, solicitante);

  await prisma.candidato.update({ where: { id_candidato: id }, data: datos });
  return obtener(id, solicitante);
}