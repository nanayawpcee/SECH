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
  // Keeps the portals out of search results. Their layouts are client
  // components, so they can't export robots metadata; robots.txt must leave
  // these paths crawlable or search engines never see this header.
  async headers() {
    // The shareable notice board also sets robots metadata in its layout; the
    // header is a second layer that holds even if that metadata is changed.
    return ['/admin', '/admin/:path*', '/staff', '/staff/:path*', '/notices', '/notices/:path*'].map((source) => ({
      source,
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    }));
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
