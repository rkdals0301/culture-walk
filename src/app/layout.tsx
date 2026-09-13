import GoogleAnalytics from '@/components/Analytics/GoogleAnalytics';
import BottomSheet from '@/components/BottomSheet/BottomSheetClientOnly';
import Header from '@/components/Header/Header';
import Main from '@/components/Main/Main';
import ServiceWorkerRegistration from '@/components/PWA/ServiceWorkerRegistration';
import SideMenu from '@/components/SideMenu/SideMenuClientOnly';
import CustomToastContainer from '@/components/Toast/ToastContainer';
import { BottomSheetProvider } from '@/context/BottomSheetContext';
import { CultureProvider } from '@/context/CultureContext';
import { SideMenuProvider } from '@/context/SideMenuContext';
import ThemeProvider from '@/providers/ThemeProvider';
import '@/styles/globals.scss';
import { serializeJsonLd } from '@/utils/jsonLd';
import Script from 'next/script';

import {
  ADSENSE_CLIENT_ID,
  GA_MEASUREMENT_ID,
  rootMetadata,
  rootViewport,
  THEME_INITIALIZER_SCRIPT,
  WEBSITE_STRUCTURED_DATA,
} from './rootLayoutConfig';

export const metadata = rootMetadata;
export const viewport = rootViewport;

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang='ko' suppressHydrationWarning>
      <head>
        <Script
          id='theme-initializer'
          strategy='beforeInteractive'
          dangerouslySetInnerHTML={{ __html: THEME_INITIALIZER_SCRIPT }}
        />
        {/* TourAPI images */}
        <link rel='dns-prefetch' href='https://tong.visitkorea.or.kr' />
        <link rel='preconnect' href='https://tong.visitkorea.or.kr' crossOrigin='anonymous' />

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
      <body suppressHydrationWarning className='min-h-dvh font-pretendard'>
        <ServiceWorkerRegistration />
        <script
          id='website-structured-data'
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(WEBSITE_STRUCTURED_DATA) }}
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
          <CustomToastContainer />
          <CultureProvider>
            <BottomSheetProvider>
              <SideMenuProvider>
                <Header />
                <SideMenu />
                <Main>{children}</Main>
                <BottomSheet />
              </SideMenuProvider>
            </BottomSheetProvider>
          </CultureProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
