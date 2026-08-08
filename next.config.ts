import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "115mb",
      allowedOrigins: [
        "localhost:3100",
        "127.0.0.1:3100",
        "192.168.1.4:3100",
      ],
    },
  },
};

export default nextConfig;
