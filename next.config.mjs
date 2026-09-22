import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

const hasGoogleAnalytics = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim());
const hasGoogleAdsense = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim());

const scriptSources = [
  "'self'",
  "'unsafe-inline'",
  'https://dapi.kakao.com',
  'https://*.daumcdn.net',
];
const connectSources = [
  "'self'",
  'https://dapi.kakao.com',
  'https://*.kakao.com',
  'https://*.daum.net',
  'https://*.daumcdn.net',
];
const frameSources = ["'self'"];

if (hasGoogleAnalytics) {
  scriptSources.push('https://www.googletagmanager.com');
  connectSources.push('https://www.google-analytics.com', 'https://*.google-analytics.com');
}

if (hasGoogleAdsense) {
  scriptSources.push(
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://tpc.googlesyndication.com'
  );
  connectSources.push(
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net'
  );
  frameSources.push(
    'https://pagead2.googlesyndication.com',
    'https://googleads.g.doubleclick.net',
    'https://tpc.googlesyndication.com',
    'https://*.googlesyndication.com'
  );
}

const BASE_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src ${scriptSources.join(' ')}`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  `connect-src ${connectSources.join(' ')}`,
  `frame-src ${frameSources.join(' ')}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Feed posters are refreshed by the scheduled sync, so keep optimized
    // variants reusable for a day without making stale images permanent.
    minimumCacheTTL: 60 * 60 * 24,
    qualities: [65, 75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tong.visitkorea.or.kr',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'Content-Security-Policy', value: BASE_CONTENT_SECURITY_POLICY },
        ],
      },
    ];
  },
  webpack: config => {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },
};

export default nextConfig;
