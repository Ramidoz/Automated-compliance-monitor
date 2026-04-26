/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    // Dev convenience: proxy /api/* to the FastAPI backend so the frontend can
    // be hit at localhost:3000 without CORS. In prod (cross-domain deploy),
    // set NEXT_PUBLIC_API_BASE to the backend URL instead — lib/api.ts uses it
    // and bypasses these rewrites entirely.
    const target = process.env.BACKEND_URL || "http://localhost:8000";
    return [{ source: "/api/:path*", destination: `${target}/api/:path*` }];
  },
};

export default nextConfig;
