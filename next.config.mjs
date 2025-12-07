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
  // Configure API routes for large uploads
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
    ]
  },
}

export default nextConfig