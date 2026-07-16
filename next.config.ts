import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  typedRoutes: true,
  async redirects() {
    return [
      {
        source: "/yonetim/danisanlar/:id",
        destination: "/yonetim/danisan-profili?clientId=:id",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
