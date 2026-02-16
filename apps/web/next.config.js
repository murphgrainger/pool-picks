/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pool-picks/api", "@pool-picks/db", "@pool-picks/utils"],
};

module.exports = nextConfig;
