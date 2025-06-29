# Dockerfile (Versión Final para Desarrollo Local)
FROM node:18-alpine

# Instalar dependencias del sistema operativo para Prisma
RUN apk add --no-cache openssl

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar solo los archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluyendo las de desarrollo)
RUN npm install

# Copiar el resto del código (aunque será sobreescrito por el volumen, es una buena práctica tenerlo)
COPY . .

# Exponer el puerto del servidor de desarrollo de Next.js
EXPOSE 3000

# El comando por defecto para iniciar el servidor de desarrollo
CMD ["npm", "run", "dev"]