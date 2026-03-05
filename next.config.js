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

  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },

  // ===== REWRITES: /api/mobile-* → /mobile-* =====
  // La PWA llama a /api/mobile-profile-v1, /api/mobile-adherence-v1, etc.
  // pero los route.ts viven sin prefijo /api/ en el App Router.
  // Este rewrite es transparente (no cambia la URL del cliente) y resuelve el 404.
  async rewrites() {
    return [
      {
        source: '/api/mobile-:segment*',
        destination: '/mobile-:segment*',
      },
    ];
  },

  // ===== CORS PARA ENDPOINTS MÓVILES (PWA) =====
  // Belt-and-suspenders: headers a nivel de framework + handlers en route.ts
  async headers() {
    const pwaOrigin = process.env.PWA_ORIGIN || 'https://doctorantivejez-patients.onrender.com';

    const corsHeaders = [
      { key: 'Access-Control-Allow-Origin', value: pwaOrigin },
      { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
      { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Requested-With' },
      { key: 'Access-Control-Allow-Credentials', value: 'true' },
      { key: 'Access-Control-Max-Age', value: '86400' },
    ];

    return [
      // Endpoints móviles bajo /mobile-* (App Router raíz — ruta real)
      { source: '/mobile-:path*', headers: corsHeaders },
      // Endpoints móviles bajo /api/mobile-* (alias usado por la PWA)
      { source: '/api/mobile-:path*', headers: corsHeaders },
      // Refresh token (usado por interceptor PWA)
      { source: '/api/auth/refresh', headers: corsHeaders },
      // Genomic extract
      { source: '/api/genomic-extract', headers: corsHeaders },
      // Clinical NLR
      { source: '/clinical-nlr-v1/:path*', headers: corsHeaders },
      // VCoach chat
      { source: '/api/vcoach/:path*', headers: corsHeaders },
    ];
  },
}

module.exports = nextConfig