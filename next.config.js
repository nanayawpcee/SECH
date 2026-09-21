// Featured images are served by the same WordPress install that answers
// GraphQL, so the next/image allowlist follows WP_GRAPHQL_ENDPOINT rather than
// pinning a hostname that would break the moment the endpoint is repointed.
// Read at build time — rebuild after changing the endpoint.
const wpEndpoint = process.env.WP_GRAPHQL_ENDPOINT;
const wpUrl = new URL(wpEndpoint ?? 'https://sech-gh.org/graphql');
const wpHostname = wpUrl.hostname;

// Once the public domain points at Vercel, WordPress lives on a subdomain.
// Staff who type sech-gh.org/wp-admin from habit would otherwise land on a
// Next.js 404, so send them across. Only emitted when the endpoint is set
// explicitly: with the fallback default the WordPress host IS the site host,
// and redirecting there would loop.
const wpAdminRedirects = wpEndpoint
  ? ['/wp-admin', '/wp-admin/:path*', '/wp-login.php'].map((source) => ({
      source,
      destination: `${wpUrl.origin}${source}`,
      permanent: false,
    }))
  : [];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return wpAdminRedirects;
  },
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', '192.168.2.82', '10.10.0.218'],
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
