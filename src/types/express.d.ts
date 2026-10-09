import type { TipoUsuario } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      usuario?: {
        id_usuario: number;
        tipo: TipoUsuario;
      };
    }
  }
}

export {};