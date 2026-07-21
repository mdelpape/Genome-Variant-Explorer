/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // VCF uploads can be large; allow bigger request bodies for the upload route.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
