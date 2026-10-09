# Multi-stage build para producción
FROM node:24-alpine AS base

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat openssl

# Dependencias de producción
FROM base AS deps

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

# Build
FROM base AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Release
FROM base AS release

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

USER node

CMD ["node", "dist/server.js"]
