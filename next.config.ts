import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "/auth/:path*",
      },
    ];
  },
};

export default nextConfig;
