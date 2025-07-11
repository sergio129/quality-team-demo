import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  
  // Add explicit environment variables for client-side
  env: {
    NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL ? 
      `https://${process.env.VERCEL_URL}` : 
      'http://localhost:3000'
  },
};

export default nextConfig;
