#!/usr/bin/env bash
    # exit on error
    set -o errexit

    echo "🔄 Iniciando build para Render..."

    # 1. Instalar dependencias
    # `npm ci` (no `npm install`): instala EXACTAMENTE lo que fija package-lock.json.
    # Con `npm install` y un lockfile desincronizado, npm resolvía versiones nuevas
    # por su cuenta en cada build — así entró vite 7 (ESM puro, exige Node >= 20.19)
    # y el build reventó con ERR_REQUIRE_ESM al cargar la config de vitest.
    # `npm ci` hace el build reproducible y falla de inmediato si el lock no cuadra.
    echo "📦 Instalando dependencias..."
    npm ci

    # 2. Generar cliente Prisma
    # No es estrictamente necesario aquí, ya que 'migrate deploy' lo hace,
    # pero es una buena práctica ser explícito.
    echo "🗄️ Generando cliente Prisma..."
    npx prisma generate

    # 3. Aplicar migraciones de la base de datos
    # Este es el comando seguro para producción.
    echo "🔄 Aplicando migraciones de la base de datos..."
    npx prisma migrate deploy

    # 4. Ejecutar pruebas clínicas obligatorias antes del build
    echo "🧪 Ejecutando suite obligatoria de tests..."
    npm run test:ci

    # 5. Construir la aplicación de Next.js
    # Llama al script 'build' del package.json, que ahora solo ejecuta 'next build'.
    echo "🏗️ Ejecutando build de Next.js..."
    npm run build

    echo "✅ Build completado exitosamente"