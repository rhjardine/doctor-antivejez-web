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
      // Endpoints móviles bajo /mobile-* (App Router raíz)
      { source: '/mobile-:path*', headers: corsHeaders },
      // Endpoints móviles bajo /api/mobile-* (por si hubiera)
      { source: '/api/mobile-:path*', headers: corsHeaders },
      // Refresh token (usado por interceptor PWA)
      { source: '/api/auth/refresh', headers: corsHeaders },
      // Genomic extract (usado desde PWA)
      { source: '/api/genomic-extract', headers: corsHeaders },
      // Clinical NLR (usado desde PWA)
      { source: '/clinical-nlr-v1/:path*', headers: corsHeaders },
      // VCoach chat (usado desde PWA)
      { source: '/api/vcoach/:path*', headers: corsHeaders },
    ];
  },
}

module.exports = nextConfig