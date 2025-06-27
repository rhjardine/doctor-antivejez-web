# Dockerfile (ubicación raíz del proyecto)
FROM node:20-slim AS builder

# 1. Configura entorno
WORKDIR /app
ENV NODE_ENV=production

# 2. Copia dependencias e instala
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci --include=dev

# 3. Genera cliente Prisma y construye
RUN npx prisma generate
COPY . .
RUN npm run build # Este comando debe correr `prisma generate && next build` (ver package.json)

# 4. Prepara imagen de producción (Runner Stage)
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copia los archivos de la aplicación construidos para el modo 'standalone'
# Esto incluye el servidor, las páginas y las dependencias de producción.
COPY --from=builder /app/.next/standalone ./

# Copia explícitamente los binarios de Prisma y su cliente que no siempre se empaquetan en standalone
# Esto es vital para que Prisma funcione en runtime.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copia la carpeta 'public' para assets estáticos
COPY --from=builder /app/public ./public

# Opcional: Limpia la caché de npm para reducir el tamaño de la imagen final (si se ejecuta npm install en runner stage)
# RUN npm cache clean --force # No es necesario si no se ejecuta `npm install` en esta etapa

# 5. Expone puerto y ejecuta
EXPOSE 3000
# El comando para ejecutar una aplicación Next.js standalone es 'node server.js'
CMD ["node", "server.js"]