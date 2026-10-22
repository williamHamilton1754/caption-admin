import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Profile photos are served from Supabase Storage.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
