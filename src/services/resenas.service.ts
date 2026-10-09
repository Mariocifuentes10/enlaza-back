import { Prisma } from '@prisma/client';
import { prisma } from '../config/db.js';
import { ApiError } from '../shared/ApiError.js';
import type { UsuarioSolicitante } from './candidatos.service.js';
import type { CrearResenaInput } from '../schemas/resenas.schemas.js';

const estadosConInteraccion: Prisma.PostulacionWhereInput['estado'] = { in: ['entrevista', 'contratada'] };

export interface ResenaRespuesta {
  id_resena: number;
  id_candidato: number;
  id_empresa: number;
  calificacion: number;
  comentario: string | null;
  fecha_resena: Date;
  moderada: boolean;
  candidato: { id_candidato: number; nombre_completo: string; visible_discapacidad: boolean };
}

export interface ListadoResenas {
  total: number;
  promedio: number | null;
  data: ResenaRespuesta[];
}

const incluirResena = {
  candidato: { select: { id_candidato: true, nombre_completo: true, visible_discapacidad: true } },
} satisfies Prisma.ResenaInclude;

type ResenaConCandidato = Prisma.ResenaGetPayload<{ include: typeof incluirResena }>;

const mapearResena = (resena: ResenaConCandidato): ResenaRespuesta => ({
  id_resena: resena.id_resena,
  id_candidato: resena.id_candidato,
  id_empresa: resena.id_empresa,
  calificacion: resena.calificacion,
  comentario: resena.comentario,
  fecha_resena: resena.fecha_resena,
  moderada: resena.moderada,
  candidato: resena.candidato,
});

export async function crear(
  idEmpresa: number,
  datos: CrearResenaInput,
  solicitante: UsuarioSolicitante,
): Promise<ResenaRespuesta> {
  if (solicitante.tipo !== 'candidato') {
    throw new ApiError(403, 'Solo los candidatos pueden publicar reseñas de empresas.', 'CANDIDATO_REQUERIDO');
  }

  const candidato = await prisma.candidato.findUnique({ where: { id_usuario: solicitante.id_usuario } });
  if (!candidato) {
    throw new ApiError(404, 'No se encontró el perfil de candidato solicitado.', 'CANDIDATO_NO_ENCONTRADO');
  }

  const empresa = await prisma.empresa.findUnique({ where: { id_empresa: idEmpresa } });
  if (!empresa) {
    throw new ApiError(404, 'No se encontró el perfil de empresa solicitado.', 'EMPRESA_NO_ENCONTRADA');
  }

  const postulacionElegible = await prisma.postulacion.findFirst({
    where: {
      id_candidato: candidato.id_candidato,
      estado: estadosConInteraccion,
      vacante: { id_empresa: idEmpresa },
    },
  });
  if (!postulacionElegible) {
    throw new ApiError(
      403,
      'Solo puedes reseñar empresas con las que hayas tenido una entrevista o hayas sido contratado.',
      'RESENA_NO_PERMITIDA',
    );
  }

  try {
    const resena = await prisma.resena.create({
      data: {
        id_candidato: candidato.id_candidato,
        id_empresa: idEmpresa,
        calificacion: datos.calificacion,
        comentario: datos.comentario ?? null,
      },
      include: incluirResena,
    });
    return mapearResena(resena);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ApiError(409, 'Ya publicaste una reseña de esta empresa.', 'RESENA_YA_EXISTE');
    }
    throw error;
  }
}

export async function listar(idEmpresa: number): Promise<ListadoResenas> {
  const empresa = await prisma.empresa.findUnique({ where: { id_empresa: idEmpresa } });
  if (!empresa) {
    throw new ApiError(404, 'No se encontró el perfil de empresa solicitado.', 'EMPRESA_NO_ENCONTRADA');
  }

  const resenas = await prisma.resena.findMany({
    where: { id_empresa: idEmpresa },
    include: incluirResena,
    orderBy: { fecha_resena: 'desc' },
  });

  const promedio =
    resenas.length === 0 ? null : resenas.reduce((suma, resena) => suma + resena.calificacion, 0) / resenas.length;

  return { total: resenas.length, promedio, data: resenas.map(mapearResena) };
}