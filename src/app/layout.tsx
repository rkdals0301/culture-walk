import Header from '@/components/Header/Header';
import Main from '@/components/Main/Main';
import { BottomSheetProvider } from '@/context/BottomSheetContext';
import { SideMenuProvider } from '@/context/SideMenuContext';
// import '@/styles/reset.scss';
import '@/styles/globals.scss';

import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';

// import pretendard from '../../public/assets/fonts/pretendard';

const QueryClientProvider = dynamic(() => import('@/providers/QueryClientProvider'), { ssr: false });
const ThemeProvider = dynamic(() => import('@/providers/ThemeProvider'), { ssr: false });
const ReduxProvider = dynamic(() => import('@/providers/ReduxProvider'), { ssr: false });

const SideMenu = dynamic(() => import('@/components/SideMenu/SideMenu'), { ssr: false });
const BottomSheet = dynamic(() => import('@/components/BottomSheet/BottomSheet'), { ssr: false });
const CustomToastContainer = dynamic(() => import('@/components/Toast/ToastContainer'), { ssr: false });

export const metadata: Metadata = {
  title: {
    default: '문화산책',
    template: '%s | 문화산책',
  },
  icons: [
    { rel: 'icon', type: 'image/png', url: '/favicon-48x48.png', sizes: '48x48' },
    { rel: 'icon', type: 'image/svg+xml', url: '/favicon.svg' },
    { rel: 'icon', url: '/favicon.ico', sizes: 'any' }, // 기본 ico 파일
    { rel: 'apple-touch-icon', type: 'image/png', sizes: '180x180', url: '/apple-touch-icon-180x180.png' },
  ],
  description:
    '서울시 문화행사 지도를 통해 서울의 다양한 문화행사 정보를 한눈에 확인하세요. 실시간으로 업데이트되는 행사와 공연 정보를 지도에서 직접 찾아보세요.',
  keywords:
    '서울시 문화행사, 서울 문화 행사, 서울 공연, 서울 전시회, 서울시 이벤트, 서울 문화 축제, 서울 시내 행사, 서울 문화 지도, 서울 문화 활동, 서울 시민 문화',
  verification: {
    other: {
      'google-site-verification': '66miDIhrDH8lCNzTkOQ4cJCs6iyOiVAdPxrF-ZoOEKo',
      'naver-site-verification': '9be5b4849e8b76cfe8b1b4e00d9bc16c9d3d5db5',
    },
  },
  // manifest: 'https://culturewalk.vercel.app/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://culturewalk.vercel.app',
    title: '문화산책',
    siteName: '문화산책',
    images: [
      {
        url: 'https://culturewalk.vercel.app/assets/images/logo.svg',
        width: 1200,
        height: 630,
        alt: 'culturewalk',
        type: 'image/svg+xml',
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
        url: 'https://culturewalk.vercel.app/assets/images/logo.svg',
        width: 1200,
        height: 675,
        alt: 'culturewalk',
        type: 'image/svg+xml',
      },
    ],
  },
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  // maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
  colorScheme: 'light dark',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang='ko'>
      <head>
        {/* Culture Seoul */}
        <link rel='dns-prefetch' href='//culture.seoul.go.kr' />
        <link rel='preconnect' href='https://culture.seoul.go.kr' crossOrigin='anonymous' />

        {/* Google Maps */}
        <link rel='dns-prefetch' href='//maps.googleapis.com' />
        <link rel='dns-prefetch' href='//maps.gstatic.com' />
        <link rel='preconnect' href='https://maps.googleapis.com' crossOrigin='anonymous' />
        <link rel='preconnect' href='https://maps.gstatic.com' crossOrigin='anonymous' />

        {/* Google Analytics */}
        <link rel='dns-prefetch' href='//www.google-analytics.com' />
        <link rel='preconnect' href='https://www.google-analytics.com' crossOrigin='anonymous' />

        <noscript>You need to enable JavaScript to run this app.</noscript>
      </head>
      {/* ${pretendard.className} */}
      <body className={`safe-area h-dvh touch-pan-y bg-white text-gray-900 dark:bg-neutral-900 dark:text-gray-100`}>
        <QueryClientProvider>
          <ThemeProvider>
            <ReduxProvider>
              <BottomSheetProvider>
                <SideMenuProvider>
                  <Header />
                  <SideMenu />
                  <Main>{children}</Main>
                  <BottomSheet />
                  <CustomToastContainer />
                </SideMenuProvider>
              </BottomSheetProvider>
            </ReduxProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
