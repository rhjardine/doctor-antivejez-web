# Dockerfile

# 1. Etapa Base con todas las dependencias
FROM node:18-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
# Usamos npm install para instalar todo, incluyendo devDependencies
RUN npm install

# 2. Etapa de Construcción
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
# La DATABASE_URL es solo un placeholder para que Prisma no falle
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
# El build se encarga de todo: prisma generate, migrate y next build
RUN npm run build

# 3. Etapa Final de Producción
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
# Usamos la salida 'standalone' para una imagen final más pequeña
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]