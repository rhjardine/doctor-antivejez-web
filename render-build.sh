#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🔄 Iniciando build para Render..."

# 1. Instalar dependencias
# Usamos 'npm install' en lugar de 'npm ci' para mayor flexibilidad
# con las versiones de los paquetes en el lockfile.
echo "📦 Instalando dependencias..."
npm install

# 2. Generar cliente de Prisma
# Esencial para que tu aplicación pueda interactuar con la base de datos.
echo "🗄️ Generando cliente Prisma..."
npx prisma generate

# 3. Ejecutar migraciones de la base de datos
# Asegura que el esquema de la base de datos esté actualizado.
echo "🔄 Aplicando migraciones de la base de datos..."
npx prisma migrate deploy

# 4. Construir la aplicación de Next.js
# Crea la versión optimizada para producción.
echo "🏗️ Ejecutando build de Next.js..."
npm run build

echo "✅ Build completado exitosamente"
