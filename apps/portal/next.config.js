/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@spotlight/shared",
    "@spotlight/db",
  ],
};

module.exports = nextConfig;
