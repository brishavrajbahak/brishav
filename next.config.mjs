/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  turbopack: {
    root: process.cwd()
  },
  poweredByHeader: false,
  reactStrictMode: true
};

export default nextConfig;
