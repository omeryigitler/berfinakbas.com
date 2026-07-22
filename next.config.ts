import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const sharedSecurityHeaders = [
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  async headers() {
    return [
      {
        source: "/yonetim/kedi/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          ...sharedSecurityHeaders,
        ],
      },
      {
        source: "/((?!yonetim/kedi).*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
          },
          { key: "X-Frame-Options", value: "DENY" },
          ...sharedSecurityHeaders,
        ],
      },
    ];
  },
  async redirects() {
    return [];
  },
};

export default withBotId(nextConfig);
