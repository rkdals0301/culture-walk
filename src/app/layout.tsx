import GoogleAnalytics from '@/components/Analytics/GoogleAnalytics';
import BottomSheet from '@/components/BottomSheet/BottomSheetClientOnly';
import Header from '@/components/Header/Header';
import Main from '@/components/Main/Main';
import { BottomSheetProvider } from '@/context/BottomSheetContext';
import { CultureProvider } from '@/context/CultureContext';
import { SideMenuProvider } from '@/context/SideMenuContext';
import ThemeProvider from '@/providers/ThemeProvider';
import '@/styles/globals.scss';

import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import Script from 'next/script';

const SideMenu = dynamic(() => import('@/components/SideMenu/SideMenu'), {
  loading: () => null,
});
const CustomToastContainer = dynamic(() => import('@/components/Toast/ToastContainer'));
const SITE_URL =
  process.env.SITE_URL || process.env.APP_BASE_URL || 'https://culturewalk.gangmin.dev';
const OG_IMAGE_URL = `${SITE_URL}/assets/images/og-image.png`;
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GOOGLE_SITE_VERIFICATION =
  process.env.GOOGLE_SITE_VERIFICATION || '66miDIhrDH8lCNzTkOQ4cJCs6iyOiVAdPxrF-ZoOEKo';
const NAVER_SITE_VERIFICATION =
  process.env.NAVER_SITE_VERIFICATION || '9be5b4849e8b76cfe8b1b4e00d9bc16c9d3d5db5';
const WEBSITE_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: '문화산책',
      url: SITE_URL,
      inLanguage: 'ko-KR',
      description:
        '서울시 문화행사 지도를 통해 서울의 다양한 문화행사 정보를 한눈에 확인할 수 있는 서비스',
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: '문화산책',
      url: SITE_URL,
      logo: `${SITE_URL}/assets/images/logo-128.png`,
    },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: '문화산책',
  title: {
    default: '문화산책',
    template: '%s | 문화산책',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon-180x180.png', type: 'image/png', sizes: '180x180' }],
  },
  description:
    '서울시 문화행사 지도를 통해 서울의 다양한 문화행사 정보를 한눈에 확인하세요. 실시간으로 업데이트되는 행사와 공연 정보를 지도에서 직접 찾아보세요.',
  keywords:
    '서울시 문화행사, 서울 문화 행사, 서울 공연, 서울 전시회, 서울시 이벤트, 서울 문화 축제, 서울 시내 행사, 서울 문화 지도, 서울 문화 활동, 서울 시민 문화',
  category: 'travel',
  verification: {
    other: {
      'google-site-verification': GOOGLE_SITE_VERIFICATION,
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
    title: '문화산책',
    siteName: '문화산책',
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: '문화산책 - 서울 문화행사 지도',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '문화산책',
    description:
      '서울시 문화행사 지도를 통해 서울의 다양한 문화행사 정보를 한눈에 확인하세요. 실시간으로 업데이트되는 행사와 공연 정보를 지도에서 직접 찾아보세요.',
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: '문화산책 - 서울 문화행사 지도',
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f5f2' },
    { media: '(prefers-color-scheme: dark)', color: '#111614' },
  ],
  colorScheme: 'light dark',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang='ko' suppressHydrationWarning>
      <head>
        {/* Culture Seoul */}
        <link rel='dns-prefetch' href='https://culture.seoul.go.kr' />
        <link rel='preconnect' href='https://culture.seoul.go.kr' crossOrigin='anonymous' />

        {/* Kakao Maps */}
        <link rel='preconnect' href='https://dapi.kakao.com' crossOrigin='anonymous' />
        <link rel='preconnect' href='https://t1.daumcdn.net' crossOrigin='anonymous' />

        {/* Google Fonts */}
        <link rel='preconnect' href='https://fonts.googleapis.com' crossOrigin='anonymous' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />

        {/* Google Analytics */}
        <link rel='dns-prefetch' href='https://www.google-analytics.com' />

        <link
          rel='preload'
          href='https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'
          as='style'
          crossOrigin='anonymous'
        />
        <link
          rel='stylesheet'
          href='https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'
          crossOrigin='anonymous'
        />
        <noscript>
          <link
            rel='stylesheet'
            href='https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'
          />
        </noscript>
      </head>
      <body suppressHydrationWarning className='safe-area min-h-dvh font-pretendard'>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_STRUCTURED_DATA) }}
        />
        {ADSENSE_CLIENT_ID && (
          <Script
            id='google-adsense-script'
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            strategy='afterInteractive'
            async
            crossOrigin='anonymous'
          />
        )}
        <GoogleAnalytics measurementId={GA_MEASUREMENT_ID} />
        <ThemeProvider>
          <CultureProvider>
            <BottomSheetProvider>
              <SideMenuProvider>
                <Header />
                <SideMenu />
                <Main>{children}</Main>
                <BottomSheet />
                <CustomToastContainer />
              </SideMenuProvider>
            </BottomSheetProvider>
          </CultureProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
