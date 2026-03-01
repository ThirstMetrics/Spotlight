/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@spotlight/shared",
    "@spotlight/db",
    "@spotlight/data-engine",
    "@spotlight/alert-engine",
  ],
};

module.exports = nextConfig;
