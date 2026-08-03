// Featured images are served by the same WordPress install that answers
// GraphQL, so the next/image allowlist follows WP_GRAPHQL_ENDPOINT rather than
// pinning a hostname that would break the moment the endpoint is repointed.
// Read at build time — rebuild after changing the endpoint.
const wpHostname = new URL(
  process.env.WP_GRAPHQL_ENDPOINT ?? 'https://sech-gh.org/graphql',
).hostname;

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
        hostname: wpHostname,
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
