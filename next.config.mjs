/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configure static file serving for uploads
  // Note: In development, files are served directly from public/uploads
  // In production, files are served via /api/uploads/[...path] route
  async rewrites() {
    return [
      // Keep the rewrite for backward compatibility, but it's not needed in production
      {
        source: '/uploads/:path*',
        destination: '/uploads/:path*',
      },
    ]
  },
  // Configure for large file uploads
  serverRuntimeConfig: {
    // Increase body size limit for file uploads
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
  // Configure API routes for large uploads and security headers
  async headers() {
    return [
      {
        source: '/api/upload',
        headers: [
          {
            key: 'Content-Type',
            value: 'multipart/form-data',
          },
        ],
      },
      {
        // Apply CSP headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';" 
          },
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
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()'
          }
        ]
      }
    ]
  },
}

export default nextConfig