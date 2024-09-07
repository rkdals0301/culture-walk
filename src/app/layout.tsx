import type { Metadata } from 'next';
import notoSansKr from '@/fonts/notoSansKr';
import '@/styles/reset.scss';
import '@/styles/globals.scss';
import Header from '@/components/Common/Header/Header';
import Main from '@/components/Common/Main/Main';
import Footer from '@/components/Common/Footer/Footer';

export const metadata: Metadata = {
  title: {
    template: '%s | 문화산책',
    default: '문화산책',
  },
  description: '서울시의 문화행사 정보를 제공',
  icons: {
    icon: '/favicon.ico',
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang='ko'>
    <body className={notoSansKr.className}>
      <Header />
      <Main>{children}</Main>
      <Footer />
    </body>
  </html>
);

export default RootLayout;
