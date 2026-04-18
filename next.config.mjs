/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd()
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.gurkerl.at" },
      { protocol: "https", hostname: "www.gurkerl.at" }
    ]
  }
};

export default nextConfig;
