import GoogleAnalytics from '@/components/Analytics/GoogleAnalytics';
import WebVitalsReporter from '@/components/Analytics/WebVitalsReporter';
import BottomSheet from '@/components/BottomSheet/BottomSheetClientOnly';
import Header from '@/components/Header/Header';
import Main from '@/components/Main/Main';
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
        {GA_MEASUREMENT_ID && <link rel='dns-prefetch' href='https://www.google-analytics.com' />}
      </head>
      <body suppressHydrationWarning className='min-h-dvh font-pretendard'>
        <WebVitalsReporter />
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
