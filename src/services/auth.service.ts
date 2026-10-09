import bcrypt from 'bcryptjs';
import { Prisma, type TipoUsuario } from '@prisma/client';
import { prisma } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../shared/ApiError.js';
import {
  generarAccessToken,
  generarRefreshToken,
  hashToken,
  ttlAMilisegundos,
  verificarToken,
  type RefreshTokenPayload,
} from './token.service.js';
import type { DatosRegistro } from '../schemas/auth.schemas.js';

export interface SesionEmitida {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
}

interface UsuarioPublico {
  id_usuario: number;
  correo: string;
  tipo_usuario: string;
  fecha_registro: Date;
  activo: boolean;
}

const usuarioPublico = (
  usuario: { id_usuario: number; correo: string; tipo_usuario: string; fecha_registro: Date; activo: boolean },
): UsuarioPublico => ({
  id_usuario: usuario.id_usuario,
  correo: usuario.correo,
  tipo_usuario: usuario.tipo_usuario,
  fecha_registro: usuario.fecha_registro,
  activo: usuario.activo,
});

async function emitirPar(idUsuario: number, tipo: TipoUsuario): Promise<SesionEmitida> {
  const accessToken = generarAccessToken(idUsuario, tipo);
  const refresh = generarRefreshToken(idUsuario);
  await prisma.refreshToken.create({
    data: {
      token_hash: hashToken(refresh.token),
      id_usuario: idUsuario,
      expira_en: refresh.expiraEn,
    },
  });
  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: Math.floor(ttlAMilisegundos(env.ACCESS_TOKEN_TTL) / 1000),
    refresh_token: refresh.token,
  };
}

export async function registrar(datos: DatosRegistro): Promise<UsuarioPublico> {
  const hash = await bcrypt.hash(datos.contrasena, 10);

  try {
    let usuario;

    if (datos.tipo_usuario === 'empresa') {
      usuario = await prisma.usuario.create({
        data: {
          correo: datos.correo,
          contrasena_hash: hash,
          tipo_usuario: 'empresa',
          empresa: { create: { nombre_empresa: datos.nombre_empresa ?? '' } },
        },
      });
    } else if (datos.tipo_usuario === 'mentor') {
      usuario = await prisma.usuario.create({
        data: {
          correo: datos.correo,
          contrasena_hash: hash,
          tipo_usuario: 'mentor',
          candidato: {
            create: {
              nombre_completo: datos.nombre_completo ?? '',
              mentor: { create: {} },
            },
          },
        },
      });
    } else {
      usuario = await prisma.usuario.create({
        data: {
          correo: datos.correo,
          contrasena_hash: hash,
          tipo_usuario: 'candidato',
          candidato: { create: { nombre_completo: datos.nombre_completo ?? '' } },
        },
      });
    }

    return usuarioPublico(usuario);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ApiError(409, 'Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.', 'CORREO_EN_USO');
    }
    throw error;
  }
}

export async function iniciarSesion(correo: string, contrasena: string): Promise<SesionEmitida> {
  const usuario = await prisma.usuario.findUnique({ where: { correo } });

  if (!usuario || !(await bcrypt.compare(contrasena, usuario.contrasena_hash))) {
    throw new ApiError(
      401,
      'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.',
      'CREDENCIALES_INVALIDAS',
    );
  }
  if (!usuario.activo) {
    throw new ApiError(403, 'Tu cuenta está desactivada. Contacta al administrador.', 'USUARIO_INACTIVO');
  }

  return emitirPar(usuario.id_usuario, usuario.tipo_usuario);
}

export async function rotarSesion(refreshToken: string): Promise<SesionEmitida> {
  const payload = verificarToken<RefreshTokenPayload>(refreshToken);
  if (payload.tipo !== 'refresh') {
    throw new ApiError(401, 'El token no es válido para refrescar la sesión.', 'SESION_INVALIDA');
  }

  const registro = await prisma.refreshToken.findUnique({
    where: { token_hash: hashToken(refreshToken) },
    include: { usuario: true },
  });

  if (!registro || registro.revocado_en !== null || registro.expira_en.getTime() < Date.now()) {
    throw new ApiError(401, 'La sesión expiró o ya fue usada. Inicia sesión de nuevo.', 'SESION_EXPIRADA');
  }
  if (!registro.usuario.activo) {
    throw new ApiError(403, 'Tu cuenta está desactivada. Contacta al administrador.', 'USUARIO_INACTIVO');
  }

  await prisma.refreshToken.update({
    where: { id: registro.id },
    data: { revocado_en: new Date() },
  });

  return emitirPar(registro.id_usuario, registro.usuario.tipo_usuario);
}

export async function cerrarSesion(refreshToken: string): Promise<void> {
  try {
    const payload = verificarToken<RefreshTokenPayload>(refreshToken);
    const registro = await prisma.refreshToken.findUnique({
      where: { token_hash: hashToken(refreshToken) },
    });
    if (registro && payload.tipo === 'refresh' && registro.revocado_en === null) {
      await prisma.refreshToken.update({
        where: { id: registro.id },
        data: { revocado_en: new Date() },
      });
    }
  } catch {
    // Cerrar sesión nunca falla: si el token ya no es válido, no hay nada que revocar.
  }
}

export interface SesiónUsuario extends UsuarioPublico {
  id_candidato: number | null;
  id_empresa: number | null;
}

export async function obtenerUsuario(idUsuario: number): Promise<SesiónUsuario> {
  const usuario = await prisma.usuario.findUnique({
    where: { id_usuario: idUsuario },
    select: {
      id_usuario: true,
      correo: true,
      tipo_usuario: true,
      fecha_registro: true,
      activo: true,
      candidato: { select: { id_candidato: true } },
      empresa: { select: { id_empresa: true } },
    },
  });

  if (!usuario) {
    throw new ApiError(401, 'La cuenta asociada a esta sesión ya no existe.', 'SESION_INVALIDA');
  }

  const { candidato, empresa, ...resto } = usuario;
  return {
    ...resto,
    id_candidato: candidato?.id_candidato ?? null,
    id_empresa: empresa?.id_empresa ?? null,
  };
}