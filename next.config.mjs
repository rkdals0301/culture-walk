import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'culture.seoul.go.kr',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  webpack: (config, { isServer }) => {
    // Bundle analyzer 설정 추가
    if (process.env.ANALYZE === 'true') {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static', // HTML 파일로 번들 분석 보고서 생성
          reportFilename: isServer
            ? '../analyze/server.html' // 서버 측 번들 분석 결과 파일 경로
            : './analyze/client.html', // 클라이언트 측 번들 분석 결과 파일 경로
        })
      );
    }

    // 기존 webpack 설정 유지
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
