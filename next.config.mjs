const nextConfig = {
  // Configuration de base
  reactStrictMode: true,
  
  // Configuration pour Docker (standalone output)
  output: 'standalone',
  
  // Configuration des images
  images: {
    domains: ['localhost', '0.0.0.0'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '0.0.0.0',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },

  // Configuration du serveur avec headers de sécurité
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production' 
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self';"
              : "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob:;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
