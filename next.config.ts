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
    return [
      {
        source: "/yonetim/danisanlar/yeni",
        destination: "/yonetim/danisan-olustur",
        permanent: false,
      },
      {
        source: "/yonetim/danisanlar/:id",
        destination: "/yonetim/danisan-profili?clientId=:id",
        permanent: false,
      },
    ];
  },
};

export default withBotId(nextConfig);
