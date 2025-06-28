# Dockerfile (Versión Final Corregida)

# 1. Etapa de Dependencias
# Instala TODAS las dependencias, incluyendo las de desarrollo, necesarias para el build.
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# 2. Etapa de Construcción
# Copia las dependencias y el código, y construye la aplicación.
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Se necesita una URL falsa para que `prisma generate` no falle.
ENV DATABASE_URL="postgresql://placeholder"
RUN npm run build

# 3. Etapa de Producción
# Copia solo los artefactos necesarios desde la etapa de construcción para una imagen final ligera.
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copia el usuario nextjs de la etapa de builder para seguridad
COPY --from=builder /app/public ./public
# Copia la salida optimizada 'standalone'
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]