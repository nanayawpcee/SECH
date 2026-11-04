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
    return ['/admin', '/admin/:path*', '/staff', '/staff/:path*', '/notices', '/notices/:path*'].map((source) => ({
      source,
      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
    }));
  },
  allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev', '192.168.2.82', '10.10.0.218'],
  images: {
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
