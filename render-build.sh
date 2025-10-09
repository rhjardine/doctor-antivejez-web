#!/usr/bin/env bash
    # exit on error
    set -o errexit

    echo "🔄 Iniciando build para Render..."

    # 1. Instalar dependencias
    echo "📦 Instalando dependencias..."
    npm install

    # 2. Generar cliente Prisma
    # No es estrictamente necesario aquí, ya que 'migrate deploy' lo hace,
    # pero es una buena práctica ser explícito.
    echo "🗄️ Generando cliente Prisma..."
    npx prisma generate

    # 3. Aplicar migraciones de la base de datos
    # Este es el comando seguro para producción.
    echo "🔄 Aplicando migraciones de la base de datos..."
    npx prisma migrate deploy

    # 4. Construir la aplicación de Next.js
    # Llama al script 'build' del package.json, que ahora solo ejecuta 'next build'.
    echo "🏗️ Ejecutando build de Next.js..."
    npm run build

    echo "✅ Build completado exitosamente"