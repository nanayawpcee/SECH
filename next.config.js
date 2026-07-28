/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', '192.168.2.82'],
  images: {
    // AVIF first, WebP fallback — pushes delivered photo payloads well below
    // the JPEG sources sitting in public/images.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        // WordPress-hosted featured images rendered on the news pages.
        protocol: 'https',
        hostname: 'sech-gh.org',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
