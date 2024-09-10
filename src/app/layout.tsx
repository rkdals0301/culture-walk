import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import '@styles/reset.scss';
import '@styles/globals.scss';
import notoSansKr from '@fonts/notoSansKr';
import ThemeProvider from '@components/Common/Theme/ThemeProvider';
import Header from '@components/Common/Header/Header';
import Main from '@components/Common/Main/Main';
// import Footer from '@components/Common/Footer/Footer';

export const metadata: Metadata = {
  title: {
    default: '문화산책',
    template: '%s | 문화산책',
  },
  icons: [
    { rel: 'icon', url: 'https://culturewalk.vercel.app/favicon.ico' },
    { rel: 'apple-touch-icon', url: 'https://culturewalk.vercel.app/assets/apple-touch-icon-180x180.png' },
  ],
  description:
    '서울시 문화행사 지도를 통해 서울의 다양한 문화행사 정보를 한눈에 확인하세요. 실시간으로 업데이트되는 행사와 공연 정보를 지도에서 직접 찾아보세요.',
  keywords:
    '서울시 문화행사, 서울 문화 행사, 서울 공연, 서울 전시회, 서울시 이벤트, 서울 문화 축제, 서울 시내 행사, 서울 문화 지도, 서울 문화 활동, 서울 시민 문화',
  alternates: {
    canonical: 'https://culturewalk.vercel.app',
    languages: {
      ko: 'https://culturewalk.vercel.app/ko',
      en: 'https://culturewalk.vercel.app/en',
    },
  },
  // manifest: 'https://culturewalk.vercel.app/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://culturewalk.vercel.app',
    siteName: '문화산책',
    images: [
      {
        url: 'https://culturewalk.vercel.app/assets/logo.svg',
        width: 1200,
        height: 630,
        alt: 'culturewalk',
        type: 'image/svg+xml',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@yourtwitterhandle', // Twitter 핸들을 추가
    creator: '@yourtwitterhandle', // Twitter 크리에이터 핸들 추가
  },
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  // themeColor: [
  //   {
  //     media: '(prefers-color-scheme: light)',
  //     color: '#f5f5f5',
  //   },
  //   {
  //     media: '(prefers-color-scheme: dark)',
  //     color: '#1e1e1e',
  //   },
  // ],
  themeColor: '#f5f5f5',
  colorScheme: 'light dark',
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang='ko'>
      <head>
        <Script
          id='google-analytics'
          strategy='beforeInteractive'
          src={`https://www.googletagmanager.com/gtag/js?id=G-Y4XKZDK818`}
        />
        <Script id='google-analytics-init' strategy='beforeInteractive'>
          {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-Y4XKZDK818');
            `}
        </Script>
      </head>
      <body className={notoSansKr.className}>
        <ThemeProvider>
          <Header />
          <Main>{children}</Main>
          {/* <Footer /> */}
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
