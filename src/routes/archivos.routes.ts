import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { ApiError } from '../shared/ApiError.js';
import { authenticate } from '../middlewares/authenticate.js';

const DIRECTORIO_ARCHIVOS = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(DIRECTORIO_ARCHIVOS, { recursive: true });

const LIMITE_BYTES = 5 * 1024 * 1024;

const TIPOS = {
  cv: {
    mime: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensiones: ['.pdf', '.doc', '.docx'],
    descripcion: 'PDF o Word (.pdf, .doc, .docx)',
  },
  logo: {
    mime: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
    extensiones: ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
    descripcion: 'imagen (.png, .jpg, .webp, .svg)',
  },
} as const;

type TipoArchivo = keyof typeof TIPOS;

const tipoDe = (valor: unknown): TipoArchivo | undefined =>
  typeof valor === 'string' && valor in TIPOS ? (valor as TipoArchivo) : undefined;

const extensionValida = (tipo: TipoArchivo, extension: string): boolean =>
  (TIPOS[tipo].extensiones as readonly string[]).includes(extension);

const almacenamiento = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DIRECTORIO_ARCHIVOS),
  filename: (req, file, cb) => {
    const tipo = tipoDe(req.params.tipo) ?? 'cv';
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${extensionValida(tipo, extension) ? extension : '.bin'}`);
  },
});

const subida = multer({
  storage: almacenamiento,
  limits: { fileSize: LIMITE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const tipo = tipoDe(req.params.tipo);
    if (!tipo) {
      cb(new ApiError(404, 'Tipo de archivo desconocido.', 'ARCHIVO_INVALIDO'));
      return;
    }
    if (!(TIPOS[tipo].mime as readonly string[]).includes(file.mimetype)) {
      cb(
        new ApiError(
          415,
          `Formato no permitido para ${tipo}: usa ${TIPOS[tipo].descripcion}.`,
          'ARCHIVO_INVALIDO',
        ),
      );
      return;
    }
    cb(null, true);
  },
});

const recibirArchivo: RequestHandler = (req, res, next) => {
  const tipo = tipoDe(req.params.tipo);
  if (!tipo) {
    next(new ApiError(404, 'Tipo de archivo desconocido.', 'ARCHIVO_INVALIDO'));
    return;
  }
  subida.single('archivo')(req, res, next);
};

export const archivosRouter = Router();

archivosRouter.post('/:tipo', authenticate, recibirArchivo, (req, res) => {
  const archivo = req.file;
  if (!archivo) {
    throw new ApiError(400, 'Falta el archivo en el campo "archivo".', 'ARCHIVO_REQUERIDO');
  }
  res.status(201).json({
    success: true,
    data: {
      url: `${req.protocol}://${req.get('host')}/uploads/${archivo.filename}`,
      nombre: archivo.originalname,
      tamano: archivo.size,
    },
  });
});
