# Dockerfile (Versión Final y Simplificada)

# 1. Etapa Base: Instalar dependencias
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install

# 2. Etapa de Construcción: Copiar código y construir
COPY . .
# Se necesita una URL falsa para que `prisma generate` no falle
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
RUN npm run build

# 3. Comando de Inicio
EXPOSE 3000
CMD ["npm", "start"]