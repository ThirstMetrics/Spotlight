/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: [
    "@spotlight/shared",
    "@spotlight/db",
  ],
};

module.exports = nextConfig;
