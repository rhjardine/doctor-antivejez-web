/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // ===== INICIO DE LA CORRECCIÓN DEFINITIVA =====
  // Se añade la sección 'env' para exponer explícitamente la variable
  // de entorno pública al cliente.
  // Next.js se encargará de reemplazar 'process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'
  // en el código del navegador con el valor que lea aquí durante el build.
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
  // ===== FIN DE LA CORRECCIÓN DEFINITIVA =====
  // ===== FIN DE LA CORRECCIÓN DEFINITIVA =====
}

module.exports = nextConfig