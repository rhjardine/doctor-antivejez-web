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

  // ═══════════════════════════════════════════════════════════════════
  // REWRITES: mapea /api/mobile-* → /mobile-* de forma transparente
  //
  // Por qué es necesario:
  // La PWA llama a /api/mobile-profile-v1 (convención REST estándar).
  // Los route.ts viven en src/app/mobile-profile-v1/ (sin /api/).
  // Este rewrite hace que ambas URLs sean equivalentes sin mover archivos.
  // Aplica a TODOS los endpoints móviles actuales y futuros.
  // ═══════════════════════════════════════════════════════════════════
  async rewrites() {
    return [
      {
        source: '/api/mobile-:segment*',
        destination: '/mobile-:segment*',
      },
    ];
  },

  // ═══════════════════════════════════════════════════════════════════
  // HEADERS CORS: solo para endpoints móviles
  //
  // Origen exacto confirmado en los logs del error CORS:
  // 'https://doctorantivejez-patients.onrender.com'
  //
  // Se aplica ANTES del rewrite (source usa la URL que llega del browser).
  // Si la PWA tiene dominio personalizado en el futuro, agregar aquí.
  // ═══════════════════════════════════════════════════════════════════
  async headers() {
    const PWA_ORIGIN = process.env.PWA_ORIGIN || 'https://doctorantivejez-patients.onrender.com';

    const corsHeaders = [
      { key: 'Access-Control-Allow-Origin', value: PWA_ORIGIN },
      { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, OPTIONS' },
      { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      { key: 'Access-Control-Max-Age', value: '86400' },
    ];

    return [
      // Cubrir la URL que llama la PWA (/api/mobile-*)
      { source: '/api/mobile-:path*', headers: corsHeaders },
      // Cubrir también la URL real del route.ts (/mobile-*) por si hay llamadas directas
      { source: '/mobile-:path*', headers: corsHeaders },
      // Cubrir el endpoint de refresh de tokens
      { source: '/api/auth/refresh', headers: corsHeaders },
    ];
  },
};

module.exports = nextConfig;