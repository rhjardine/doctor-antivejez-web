/** @type {import('next').NextConfig} */
const nextConfig = {
  // Se elimina la opción `output: 'standalone'` para usar el modo de servidor estándar de Next.js,
  // que es más compatible con el entorno de Render y debería resolver los errores 404.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
}
module.exports = nextConfig
