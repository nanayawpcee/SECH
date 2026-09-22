// Featured images are served by the same WordPress install that answers
// GraphQL, so the next/image allowlist follows WP_GRAPHQL_ENDPOINT rather than
// pinning a hostname that would break the moment the endpoint is repointed.
// Read at build time — rebuild after changing the endpoint.
// The apex now serves this site from Vercel, so WordPress lives on its own
// subdomain — that is the default, not sech-gh.org, which would point the site
// at itself. Set WP_GRAPHQL_ENDPOINT to override.
const wpUrl = new URL(
  process.env.WP_GRAPHQL_ENDPOINT ?? 'https://wp.sech-gh.org/graphql',
);
const wpHostname = wpUrl.hostname;

// Staff who type sech-gh.org/wp-admin from habit would otherwise land on a
// Next.js 404, so send them across. Always emitted now that the WordPress host
// is a different hostname from the site's; pointing WP_GRAPHQL_ENDPOINT back at
// the site's own domain would make this loop.
const wpAdminRedirects = ['/wp-admin', '/wp-admin/:path*', '/wp-login.php'].map(
  (source) => ({
    source,
    destination: `${wpUrl.origin}${source}`,
    permanent: false,
  }),
);

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
