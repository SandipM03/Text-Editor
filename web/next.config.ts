import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // BlockNote doesn't support StrictMode with React 19
  reactStrictMode: false,
};

export default nextConfig;
