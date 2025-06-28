# Dockerfile (Versión Final para Desarrollo Local)
FROM node:18-alpine

# Instalar dependencias necesarias para Prisma en Alpine Linux
RUN apk add --no-cache openssl

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias e instalar TODAS las dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código del proyecto
COPY . .

# El comando por defecto será el de desarrollo, pero lo controlaremos desde docker-compose
CMD ["npm", "run", "dev"]