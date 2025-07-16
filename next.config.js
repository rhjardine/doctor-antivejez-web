/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ===== INICIO DE LA MODIFICACIÓN =====
  // Se actualiza la configuración de imágenes a la sintaxis moderna "remotePatterns"
  // y se elimina la obsoleta "domains". Esto mejora la compatibilidad y seguridad
  // en entornos de producción como Render.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
  // ===== FIN DE LA MODIFICACIÓN =====
}
module.exports = nextConfig
