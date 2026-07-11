/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: ["postgres"],
  },
};

export default nextConfig;
