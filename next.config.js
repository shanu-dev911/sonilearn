/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Typescript aur Linting ke saare static check ko skip karein
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 2. Next.js compiler ko strictly bolna ki data collection bypass kare
  images: {
    unoptimized: true
  }
};

export default nextConfig;
