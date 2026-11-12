const wpUrl = new URL(
  process.env.WP_GRAPHQL_ENDPOINT ?? 'https://wp.sech-gh.org/graphql',
);
const wpHostname = wpUrl.hostname;

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
  // keep the portals and staff notices out of search engines
  async headers() {
    return [
      ...['/admin', '/admin/:path*', '/staff', '/staff/:path*', '/notices', '/notices/:path*'].map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
      // the reset link carries a one-time key; don't pass the address on to anything the page loads
      { source: '/admin/reset-password', headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }] },
    ];
  },
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', '192.168.2.82', '10.10.0.218'],
  images: {
    // In development the browser loads images straight from WordPress. From some
    // networks the WordPress host sends files at about 45 KB/s, so the local image
    // optimiser gives up (504) before a large upload arrives. Production is
    // unaffected: Vercel fetches from WordPress quickly and caches the result.
    unoptimized: process.env.NODE_ENV === 'development',
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: wpHostname,
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
