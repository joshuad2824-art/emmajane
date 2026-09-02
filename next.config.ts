import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["sharp", "archiver", "pg"],
  poweredByHeader: false,
  images: {
    // Photos are served through our own access-checked route; no remote loader needed.
    unoptimized: true,
  },
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/studio", headers: noindex },
      { source: "/client-gallery", headers: noindex },
      { source: "/g/:path*", headers: noindex },
      { source: "/api/:path*", headers: noindex },
    ];
  },
};

export default nextConfig;
