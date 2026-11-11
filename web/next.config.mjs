/** @type {import('next').NextConfig} */

// The app loads no third-party scripts, styles, fonts, images, or XHR targets —
// everything is bundled or inlined — so the policy can be genuinely strict.
// 'unsafe-inline' is required for styles (Next/Tailwind inject style tags) and
// for the pre-hydration theme script in app/layout.tsx.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    // Keep older /check links usable; the address form lives on the homepage.
    return [
      { source: "/check", destination: "/#lookup", permanent: false },
      // Legal routes readers and crawlers expect. The text lives on /legal (sections #privacy and #terms).
      { source: "/privacy", destination: "/legal#privacy", permanent: true },
      { source: "/privacy-policy", destination: "/legal#privacy", permanent: true },
      { source: "/terms", destination: "/legal#terms", permanent: true },
      { source: "/affiliate-disclosure", destination: "/legal#affiliate", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), camera=(), microphone=(), payment=(), usb=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
      {
        // Address-specific reports must never be indexed — belt and braces with
        // the per-page robots directive.
        source: "/results",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          // Reports are deterministic for a given address, and the upstream
          // registries update on a weekly cadence at best — so an identical
          // lookup should not re-run the whole pipeline.
          {
            key: "Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
