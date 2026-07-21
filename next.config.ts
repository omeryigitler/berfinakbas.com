import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  async headers() {
    return [
      {
        headers: [
          {
            key: "Content-Security-Policy",
            value: "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
          },
          { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=()" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
        source: "/(.*)",
      },
    ];
  },
  async redirects() {
    return [];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        {
          source: "/yonetim",
          destination: "/yonetim-static/index.html",
        },
        {
          source: "/yonetim/assets/:path*",
          destination: "/yonetim-static/assets/:path*",
        },
      ],
      fallback: [],
    };
  },
};

export default withBotId(nextConfig);
