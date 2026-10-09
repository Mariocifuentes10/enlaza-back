import 'dotenv/config';
import { z } from 'zod';

function esClaveAnthropicValida(valor: string | undefined): boolean {
  if (!valor) {
    return false;
  }
  const limpia = valor.trim();
  return limpia.startsWith('sk-ant-') && limpia.length >= 40 && !/^sk-ant-x+$/i.test(limpia);
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().min(1).default('15m'),
  REFRESH_TOKEN_TTL: z.string().min(1).default('7d'),
  REFRESH_COOKIE_NAME: z.string().min(1).default('enlaza_refresh'),
  ANTHROPIC_API_KEY: z
    .string()
    .optional()
    .transform((valor) => (esClaveAnthropicValida(valor) ? valor!.trim() : undefined)),
  ANTHROPIC_EMBEDDING_MODEL: z.string().min(1).default('claude-haiku-5-5'),
  ANTHROPIC_CHAT_MODEL: z.string().min(1).default('claude-sonnet-5-5'),
  FRONTEND_URL: z.string().url(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
