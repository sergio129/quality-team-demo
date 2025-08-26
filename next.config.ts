import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Add explicit environment variables for client-side
  env: {
    NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL ? 
      `https://${process.env.VERCEL_URL}` : 
      'http://localhost:3000'
  },

  // Headers de seguridad y cache optimizados
  async headers() {
    return [
      {
        // Aplicar headers de seguridad a todas las rutas
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      },
      {
        // Cache largo para assets estáticos
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        // Cache para imágenes y fonts del directorio público
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        // Headers específicos para APIs internas
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-API-Version',
            value: '1.0'
          }
        ]
      }
    ]
  },
  
  // Optimizar compresión
  compress: true,
};

export default nextConfig;
