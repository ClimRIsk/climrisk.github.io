/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",      // static HTML export — no server required
  trailingSlash: true,   // /platform → /platform/index.html (GitHub Pages compatible)
  images: {
    unoptimized: true,   // required for static export (no Next.js image server)
  },
};

export default nextConfig;
