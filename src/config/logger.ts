import { pino, type LoggerOptions } from 'pino';
import { env } from './env.js';

const isProduction = env.NODE_ENV === 'production';

const baseConfig: LoggerOptions = {
  level: env.LOG_LEVEL,
};

if (isProduction) {
  baseConfig.redact = [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    'password',
    'contrasena',
    'token',
    'refreshToken',
    'refresh_token',
    'token_hash',
    'jti',
    'access_token',
  ];
}

export const logger = pino(baseConfig);
