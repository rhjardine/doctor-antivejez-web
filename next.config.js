/** @type {import('next').NextConfig} */
const nextConfig = {
  // Se preserva tu configuración existente de 'images'.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },

  // ===== INICIO DE LA CORRECCIÓN =====
  // Se añade esta configuración para aumentar el límite de tamaño del cuerpo
  // de las Server Actions. El valor '10mb' es un punto de partida razonable
  // para permitir el envío de PDFs e imágenes en los correos electrónicos.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // ===== FIN DE LA CORRECCIÓN =====
}

module.exports = nextConfig