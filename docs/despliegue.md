# Despliegue: Railway + PlanetScale

## 1. Preparación del repositorio

### Archivos incluidos
- `Dockerfile` (multi-stage, optimizado para producción)
- `src/config/sentry.ts` - integración con Sentry (opcional via SENTRY_DSN)
- Rate limiting en: `POST /api/auth/login`, `POST /api/chatbot/mensaje`
- Logging estructurado con Pino (redacta datos sensibles en producción)

### Variables de entorno requeridas
Configurar en Railway (Variables):

| Variable | Requerido | Notas |
|---|---|---|
| `NODE_ENV` | Sí | `production` |
| `PORT` | Sí | `3000` (Railway asigna automáticamente, pero mantener 3000) |
| `DATABASE_URL` | Sí | Connection string de PlanetScale (MySQL) con SSL |
| `JWT_SECRET` | Sí | Mínimo 32 caracteres |
| `ACCESS_TOKEN_TTL` | Sí | Default `15m` |
| `REFRESH_TOKEN_TTL` | Sí | Default `7d` |
| `REFRESH_COOKIE_NAME` | Sí | Default `enlaza_refresh` |
| `FRONTEND_URL` | Sí | URL frontend (para CORS) |
| `LOG_LEVEL` | Sí | `info` recomendado en producción |
| `ANTHROPIC_API_KEY` | Opcional | Requerido si chatbot activo |
| `ANTHROPIC_CHAT_MODEL` | Opcional | Default `claude-3-5-sonnet-latest` |
| `ANTHROPIC_EMBEDDING_MODEL` | Opcional | Default `claude-3-5-haiku-latest` |
| `SENTRY_DSN` | Opcional | Para tracking de errores |

## 2. Configurar PlanetScale (MySQL)

1. Crear cuenta en [planetscale.com](https://planetscale.com/)
2. Crear nueva base de datos `enlaza-back`
3. Obtener connection string: 
   - En PlanetScale > Database > Connect > "Prisma" / "General" 
   - Usar formato: `mysql://USER:PASSWORD@HOST/DB_NAME?sslmode=require&connection_limit=10`
4. Nota: PlanetScale usa MySQL compatible con Vitess; `prisma migrate deploy` recomendado para producción.

## 3. Desplegar en Railway

### Opción A: Desde GitHub (recomendado)

1. Conectar repositorio [Railway.app](https://railway.app/)
   - New Project > Deploy from GitHub repo > Seleccionar `enlaza-backend`
2. Railway detectará `Dockerfile` automáticamente
3. Configurar variables de entorno (sección Variables)
4. Agregar servicio MySQL? No usar MySQL interno; conectar a PlanetScale

### Opción B: CLI

```bash
railway login
railway init
railway up
```

## 4. Ejecutar migraciones Prisma

Railway ejecuta `CMD` desde Dockerfile (`node dist/server.js`). Las migraciones deben ejecutarse antes del primer despliegue.

### Método 1: Railway CLI / Local con DATABASE_URL prod
```bash
export DATABASE_URL="mysql://..."
npx prisma migrate deploy
```

### Método 2: Railway Deploy Hook / One-off command
En Railway > Service > Settings > Start Command, o usar "Run Command":
```bash
npx prisma migrate deploy
```

Ejecutar este comando una sola vez tras configurar DATABASE_URL.

## 5. Healthcheck

El API expone rutas via `apiRouter`. Verificar `/api/health` (definido en `src/routes/health.routes.ts`).

## 6. Notas de producción

- Cookies refresh: `secure=true` cuando `NODE_ENV=production`, `sameSite=lax`, `httpOnly=true`, `path=/api/auth`
- Rate limiting aplicado a login (15 min / 10 intentos, skipSuccess) y chatbot (1 min / 20 peticiones)
- Logging redacta: headers auth/cookie, contraseñas, tokens, jti
- Sentry captura excepciones no controladas y errores 5xx
- Prisma usa typed queries; búsqueda con fulltext usa `$queryRaw` con `Prisma.sql` (parametrizado)
- Body limit: `express.json({ limit: '1mb' })`

## 7. Post-despliegue

1. Verificar `https://<tu-app>.railway.app/api/health`
2. Probar login con credenciales válidas
3. Verificar logs en Railway (sin datos sensibles)
4. Configurar dominio personalizado si necesario (Railway Domains)
5. Actualizar `FRONTEND_URL` con dominio frontend
