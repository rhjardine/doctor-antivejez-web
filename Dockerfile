# Dockerfile (Versión Final para output: 'standalone')

# 1. Etapa de Instalación
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# 2. Etapa de Construcción
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Se necesita una URL falsa para que prisma generate no falle
ENV DATABASE_URL="postgresql://placeholder"
# El script de build ya incluye "prisma generate"
RUN npm run build

# 3. Etapa Final de Producción
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copia la salida optimizada 'standalone'
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# ⭐ ESTA ES LA LÍNEA QUE FALTABA ⭐
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
# El comando final ahora apunta al server.js dentro de la carpeta 'standalone'
CMD ["node", "server.js"]