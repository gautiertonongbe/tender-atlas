/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ["mysql2"] },
  images: { unoptimized: true },
};

export default nextConfig;
