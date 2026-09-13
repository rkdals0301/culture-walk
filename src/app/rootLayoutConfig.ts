import type { Metadata, Viewport } from 'next';

import {
  BRAND_ASSET_VERSION,
  OG_IMAGE_URL,
  SEARCH_THUMBNAIL_URL,
  SITE_NAME,
  SITE_URL,
} from '@/utils/siteMetadata';

const GOOGLE_SITE_VERIFICATION =
  process.env.GOOGLE_SITE_VERIFICATION || '66miDIhrDH8lCNzTkOQ4cJCs6iyOiVAdPxrF-ZoOEKo';
const NAVER_SITE_VERIFICATION =
  process.env.NAVER_SITE_VERIFICATION || 'a33276bf6f5a8e13bf6f4009af7828cbaa3cdbb1';

export const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const THEME_INITIALIZER_SCRIPT = `(() => {
  try {
    const storedTheme = localStorage.getItem('theme');
    const theme = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.style.colorScheme = theme;
  } catch {
    // Theme initialization is best effort when storage is unavailable.
  }
})();`;

export const WEBSITE_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      inLanguage: 'ko-KR',
      description: '전국 문화행사 지도를 통해 지역별 축제와 행사 정보를 한눈에 확인할 수 있는 서비스',
      image: { '@id': `${SITE_URL}/#primaryimage` },
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/assets/images/logo-128.png`,
      description: '전국의 축제, 공연, 전시, 체험 행사를 지도에서 찾는 문화행사 탐색 서비스',
      areaServed: {
        '@type': 'Country',
        name: '대한민국',
      },
    },
    {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}/#primaryimage`,
      url: OG_IMAGE_URL,
      contentUrl: OG_IMAGE_URL,
      thumbnailUrl: SEARCH_THUMBNAIL_URL,
      width: 1200,
      height: 630,
      caption: '문화산책 전국 문화행사 지도',
      inLanguage: 'ko-KR',
    },
  ],
};

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  referrer: 'strict-origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  icons: {
    icon: [
      { url: `/favicon.svg?v=${BRAND_ASSET_VERSION}`, type: 'image/svg+xml', sizes: 'any' },
      { url: `/favicon-16x16.png?v=${BRAND_ASSET_VERSION}`, type: 'image/png', sizes: '16x16' },
      { url: `/favicon-32x32.png?v=${BRAND_ASSET_VERSION}`, type: 'image/png', sizes: '32x32' },
      { url: `/favicon-48x48.png?v=${BRAND_ASSET_VERSION}`, type: 'image/png', sizes: '48x48' },
      { url: `/favicon.ico?v=${BRAND_ASSET_VERSION}`, sizes: 'any' },
    ],
    shortcut: `/favicon.ico?v=${BRAND_ASSET_VERSION}`,
    apple: [
      { url: `/apple-touch-icon-180x180.png?v=${BRAND_ASSET_VERSION}`, type: 'image/png', sizes: '180x180' },
    ],
  },
  description:
    '전국 문화행사 지도를 통해 지역별 축제와 행사 정보를 한눈에 확인하세요. 매일 갱신되는 행사 정보를 지도에서 직접 찾아보세요.',
  keywords: '전국 문화행사, 전국 축제, 지역 축제, 국내 행사, 문화 행사, 공연, 전시, 체험, 문화 지도, 여행 행사',
  category: 'travel',
  verification: {
    google: GOOGLE_SITE_VERIFICATION,
    other: {
      'naver-site-verification': NAVER_SITE_VERIFICATION,
    },
  },
  other: ADSENSE_CLIENT_ID
    ? {
        'google-adsense-account': ADSENSE_CLIENT_ID,
      }
    : undefined,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    title: SITE_NAME,
    description: '전국의 축제·공연·전시·체험 정보를 지도에서 탐색하고 상세 정보를 확인하세요.',
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: '문화산책 - 전국 문화행사 지도',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description:
      '전국 문화행사 지도를 통해 지역별 축제와 행사 정보를 한눈에 확인하세요. 매일 갱신되는 행사 정보를 지도에서 직접 찾아보세요.',
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: '문화산책 - 전국 문화행사 지도',
        type: 'image/png',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const rootViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9fafb' },
    { media: '(prefers-color-scheme: dark)', color: '#101012' },
  ],
  colorScheme: 'light dark',
};
