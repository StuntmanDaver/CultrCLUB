/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    // Skip in dev — React fast-refresh needs `unsafe-eval`, which breaks hydration under this CSP.
    // Cloudflare Pages ignores next.config.js headers in prod anyway (covered by _headers + middleware).
    if (process.env.NODE_ENV === 'development') return []
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.clarity.ms",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://www.clarity.ms",
              "connect-src 'self' https://challenges.cloudflare.com https://www.clarity.ms https://m.clarity.ms",
              "frame-src 'self' https://challenges.cloudflare.com",
            ].join('; '),
          },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          // Stealth: HTTP-layer indexing block (overrides HTML meta in some engines).
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex, nocache' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
