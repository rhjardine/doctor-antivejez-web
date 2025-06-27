# Stage 1: Dependencies (instala todas las dependencias)
# Usamos node:18-slim para evitar problemas de glibc que puedan afectar a Prisma en Alpine
FROM node:18-slim AS deps
WORKDIR /app
# Instala openssl y gcompat (para compatibilidad con glibc si fuera necesario para otros binarios)
# Aunque 'slim' ya viene con glibc, openssl puede ser útil si Prisma lo busca
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm install

# Stage 2: Builder (construye la aplicación)
FROM node:18-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Genera el cliente Prisma (necesita acceso a la DATABASE_URL si es durante el build)
# Asegúrate que DATABASE_URL esté disponible como variable de entorno en esta etapa si npx prisma generate lo necesita para validar.
RUN npx prisma generate
# Ejecuta el build de Next.js (que incluye prisma migrate deploy)
# La DATABASE_URL debe estar disponible aquí para prisma migrate deploy
RUN npm run build

# Stage 3: Runner (la imagen final para producción)
FROM node:18-slim AS runner
WORKDIR /app
ENV NODE_ENV production

# Configura un usuario no-root para mayor seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Copia los archivos de la aplicación construidos en la etapa 'builder'
# Esto es específico para 'output: standalone'
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/public ./public
# Si tienes un prisma/schema.prisma en la raiz, tambien copialo si es necesario para runtime queries
# COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma

# Asegura que el usuario 'nextjs' sea el propietario de los archivos
RUN chown -R nextjs:nodejs ./.next

EXPOSE 3000

# Comando de inicio para la aplicación Next.js standalone
CMD ["node", "server.js"]