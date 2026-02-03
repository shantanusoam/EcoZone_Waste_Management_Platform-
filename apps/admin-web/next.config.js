/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ecozone/types", "@ecozone/ui"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

module.exports = nextConfig;
