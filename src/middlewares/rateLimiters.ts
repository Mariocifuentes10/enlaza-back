import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { ApiError } from '../shared/ApiError.js';
import { logger } from '../config/logger.js';

const handleRateLimit = (req: Request, _res: Response, _next: () => void, _options: unknown) => {
  logger.warn(
    {
      ip: req.ip,
      method: req.method,
      path: req.path,
      userId: req.usuario?.id_usuario,
    },
    'Rate limit exceeded'
  );
  throw new ApiError(429, 'Demasiadas peticiones. Inténtalo de nuevo más tarde.', 'RATE_LIMIT_EXCEEDED');
};

const createLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) =>
  rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: handleRateLimit,
    skipSuccessfulRequests: options.skipSuccessfulRequests,
  });

export const authLoginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
});

export const chatbotLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 20,
  skipSuccessfulRequests: false,
});
