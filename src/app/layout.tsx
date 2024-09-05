import type { Metadata } from 'next';
import '@/app/reset.scss';
import '@/app/globals.scss';
import notoSansKr from '@/app/fonts/notoSansKr';

export const metadata: Metadata = {
  title: {
    template: '%s | 문화산책',
    default: '문화산책',
  },
  description: '서울시의 문화행사 정보를 제공',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko'>
      <body className={notoSansKr.className}>{children}</body>
    </html>
  );
}
