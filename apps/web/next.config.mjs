/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@librarian/database",
    "@librarian/storage",
    "@librarian/ai",
    "@librarian/auth",
    "@librarian/jobs",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
