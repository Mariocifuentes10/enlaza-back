import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().min(1).default('15m'),
  REFRESH_TOKEN_TTL: z.string().min(1).default('7d'),
  REFRESH_COOKIE_NAME: z.string().min(1).default('enlaza_refresh'),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_EMBEDDING_MODEL: z.string().min(1).default('claude-3-5-haiku-latest'),
  ANTHROPIC_CHAT_MODEL: z.string().min(1).default('claude-3-5-sonnet-latest'),
  FRONTEND_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;