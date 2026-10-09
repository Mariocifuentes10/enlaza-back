import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { ApiError } from '../shared/ApiError.js';
import type { UsuarioSolicitante } from './candidatos.service.js';
import type { ActivarMentorInput, AgendarMentoriaInput } from '../schemas/mentores.schemas.js';

export interface MentorRespuesta {
  id_mentor: number;
  id_candidato: number;
  biografia: string | null;
  disponible: boolean;
  candidato: {
    id_candidato: number;
    nombre_completo: string;
    ubicacion: string | null;
    resumen_perfil: string | null;
  };
}

export interface MentoriaRespuesta {
  id_mentoria: number;
  id_mentor: number;
  id_candidato: number;
  fecha_sesion: Date | null;
  notas: string | null;
  mentor: { id_mentor: number; candidato: { id_candidato: number; nombre_completo: string } };
}

const incluirMentor = {
  candidato: {
    select: { id_candidato: true, nombre_completo: true, ubicacion: true, resumen_perfil: true },
  },
} satisfies Prisma.MentorInclude;

type MentorConCandidato = Prisma.MentorGetPayload<{ include: typeof incluirMentor }>;

function mapearMentor(mentor: MentorConCandidato): MentorRespuesta {
  return {
    id_mentor: mentor.id_mentor,
    id_candidato: mentor.id_candidato,
    biografia: mentor.biografia,
    disponible: mentor.disponible,
    candidato: mentor.candidato,
  };
}

export async function listarMentores(): Promise<MentorRespuesta[]> {
  const mentores = await prisma.mentor.findMany({
    where: { disponible: true },
    include: incluirMentor,
    orderBy: { candidato: { nombre_completo: 'asc' } },
  });
  return mentores.map(mapearMentor);
}

export async function activarMentor(datos: ActivarMentorInput, solicitante: UsuarioSolicitante): Promise<MentorRespuesta> {
  if (solicitante.tipo !== 'candidato') {
    throw new ApiError(403, 'Solo los candidatos pueden activarse como mentores.', 'CANDIDATO_REQUERIDO');
  }

  const candidato = await prisma.candidato.findUnique({ where: { id_usuario: solicitante.id_usuario } });
  if (!candidato) {
    throw new ApiError(404, 'No se encontró el perfil de candidato solicitado.', 'CANDIDATO_NO_ENCONTRADO');
  }

  const existente = await prisma.mentor.findUnique({ where: { id_candidato: candidato.id_candidato } });
  if (existente) {
    throw new ApiError(409, 'Ya eres mentor. Solo puedes actualizar tu perfil.', 'MENTOR_YA_EXISTE');
  }

  const mentor = await prisma.mentor.create({
    data: { id_candidato: candidato.id_candidato, biografia: datos.biografia },
    include: incluirMentor,
  });

  return mapearMentor(mentor);
}

export async function agendarMentoria(
  datos: AgendarMentoriaInput,
  solicitante: UsuarioSolicitante,
): Promise<MentoriaRespuesta> {
  if (solicitante.tipo !== 'candidato' && solicitante.tipo !== 'mentor') {
    throw new ApiError(403, 'Solo perfiles de candidato pueden agendar una mentoría.', 'CANDIDATO_REQUERIDO');
  }

  const candidato = await prisma.candidato.findUnique({ where: { id_usuario: solicitante.id_usuario } });
  if (!candidato) {
    throw new ApiError(404, 'No se encontró el perfil de candidato solicitado.', 'CANDIDATO_NO_ENCONTRADO');
  }

  const mentor = await prisma.mentor.findUnique({
    where: { id_mentor: datos.id_mentor },
    include: { candidato: { select: { id_candidato: true, nombre_completo: true } } },
  });
  if (!mentor) {
    throw new ApiError(404, 'No se encontró el mentor indicado.', 'MENTOR_NO_ENCONTRADO');
  }
  if (mentor.id_candidato === candidato.id_candidato) {
    throw new ApiError(400, 'No puedes agendar una mentoría contigo mismo.', 'NO_AUTO_MENTORIA');
  }

  const mentoria = await prisma.mentoria.create({
    data: {
      id_mentor: mentor.id_mentor,
      id_candidato: candidato.id_candidato,
      fecha_sesion: datos.fecha_sesion,
      notas: datos.notas,
    },
    include: {
      mentor: { include: { candidato: { select: { id_candidato: true, nombre_completo: true } } } },
    },
  });

  return {
    id_mentoria: mentoria.id_mentoria,
    id_mentor: mentoria.id_mentor,
    id_candidato: mentoria.id_candidato,
    fecha_sesion: mentoria.fecha_sesion,
    notas: mentoria.notas,
    mentor: mentoria.mentor,
  };
}