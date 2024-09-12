/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['culture.seoul.go.kr'], // 허용할 도메인 추가
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*/',
        destination: `http://openapi.seoul.go.kr:8088/:path*/`,
      },
    ];
  },
  trailingSlash: true,
};

export default nextConfig;
