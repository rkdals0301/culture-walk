import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import '@/styles/reset.scss';
import '@/styles/globals.scss';
import notoSansKr from '@/fonts/notoSansKr';
const ThemeProvider = dynamic(() => import('@/providers/ThemeProvider'), { ssr: false });
import ReduxProvider from '@/providers/ReduxProvider';
import QueryClientProvider from '@/providers/QueryClientProvider';
import Header from '@/components/Header/Header';
import Main from '@/components/Main/Main';
// import Footer from '@/components/Common/Footer/Footer';
import CustomToastContainer from '@/components/Toast/ToastContainer';
import SideMenu from '@/components/SideMenu/SideMenu';

export const metadata: Metadata = {
  title: {
    default: '문화산책',
    template: '%s | 문화산책',
  },
  icons: [
    { rel: 'icon', url: '/favicon.ico', sizes: 'any' }, // 기본 ico 파일
    { rel: 'icon', type: 'image/png', sizes: '16x16', url: '/favicon-16x16.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', url: '/favicon-32x32.png' },
    { rel: 'apple-touch-icon', type: 'image/png', sizes: '57x57', url: '/apple-touch-icon-57x57.png' },
    { rel: 'apple-touch-icon', type: 'image/png', sizes: '60x60', url: '/apple-touch-icon-60x60.png' },
    { rel: 'apple-touch-icon', type: 'image/png', sizes: '72x72', url: '/apple-touch-icon-72x72.png' },
    { rel: 'apple-touch-icon', type: 'image/png', sizes: '76x76', url: '/apple-touch-icon-76x76.png' },
    { rel: 'apple-touch-icon', type: 'image/png', sizes: '114x114', url: '/apple-touch-icon-114x114.png' },
    { rel: 'apple-touch-icon', type: 'image/png', sizes: '120x120', url: '/apple-touch-icon-120x120.png' },
    { rel: 'apple-touch-icon', type: 'image/png', sizes: '144x144', url: '/apple-touch-icon-144x144.png' },
    { rel: 'apple-touch-icon', type: 'image/png', sizes: '152x152', url: '/apple-touch-icon-152x152.png' },
    { rel: 'apple-touch-icon', type: 'image/png', sizes: '180x180', url: '/apple-touch-icon-180x180.png' },
  ],
  description:
    '서울시 문화행사 지도를 통해 서울의 다양한 문화행사 정보를 한눈에 확인하세요. 실시간으로 업데이트되는 행사와 공연 정보를 지도에서 직접 찾아보세요.',
  keywords:
    '서울시 문화행사, 서울 문화 행사, 서울 공연, 서울 전시회, 서울시 이벤트, 서울 문화 축제, 서울 시내 행사, 서울 문화 지도, 서울 문화 활동, 서울 시민 문화',
  verification: {
    other: {
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
    title: '문화산책',
    description:
      '서울시 문화행사 지도를 통해 서울의 다양한 문화행사 정보를 한눈에 확인하세요. 실시간으로 업데이트되는 행사와 공연 정보를 지도에서 직접 찾아보세요.',
    images: [
      {
        url: 'https://culturewalk.vercel.app/assets/logo.svg',
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
  maximumScale: 5,
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

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang='ko'>
      <head>
        {process.env.NODE_ENV === 'production' && (
          <>
            <Script
              id='google-analytics'
              strategy='lazyOnload'
              src={`https://www.googletagmanager.com/gtag/js?id=G-Y4XKZDK818`}
            />
            <Script
              id='google-analytics-init'
              strategy='lazyOnload'
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', 'G-Y4XKZDK818');
                `,
              }}
            />
          </>
        )}

        {/* <Script
          id='channel-talk-script'
          strategy='lazyOnload'
          dangerouslySetInnerHTML={{
            __html: `
              (function(){var w=window;if(w.ChannelIO){return w.console.error("ChannelIO script included twice.");}var ch=function(){ch.c(arguments);};ch.q=[];ch.c=function(args){ch.q.push(args);};w.ChannelIO=ch;function l(){if(w.ChannelIOInitialized){return;}w.ChannelIOInitialized=true;var s=document.createElement("script");s.type="text/javascript";s.async=true;s.src="https://cdn.channel.io/plugin/ch-plugin-web.js";var x=document.getElementsByTagName("script")[0];if(x.parentNode){x.parentNode.insertBefore(s,x);}}if(document.readyState==="complete"){l();}else{w.addEventListener("DOMContentLoaded",l);w.addEventListener("load",l);}})();

              ChannelIO('boot', {
                "pluginKey": "4ef79cde-b936-48a0-a501-2ccda61855e4",
                "zIndex": 2,
                "appearance": "system"
              });
            `,
          }}
        /> */}
        <noscript>You need to enable JavaScript to run this app.</noscript>
      </head>
      <body className={notoSansKr.className}>
        <QueryClientProvider>
          <ThemeProvider>
            <ReduxProvider>
              <Header />
              <SideMenu />
              <Main>{children}</Main>
              {/* <Footer /> */}
              <CustomToastContainer /> {/* 여기에서 ToastContainer 추가 */}
            </ReduxProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
