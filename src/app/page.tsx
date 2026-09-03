import type { Metadata } from 'next';

import FeedView from '@/components/Feed/FeedView';

const SITE_URL = process.env.SITE_URL || process.env.APP_BASE_URL || 'https://culturewalk.gangmin.dev';
const OG_IMAGE_URL = `${SITE_URL}/assets/images/og-image.png?v=20260715`;
const SEARCH_THUMBNAIL_URL = `${SITE_URL}/assets/images/search-thumbnail.png?v=20260715`;
const TITLE = '문화산책 | 전국 문화행사 둘러보기';
const DESCRIPTION = '전국의 축제·공연·전시·체험 정보를 한눈에 둘러보고, 지도와 함께 원하는 행사를 발견하세요.';

export const metadata: Metadata = {
  title: {
    absolute: TITLE,
  },
  description: DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    title: TITLE,
    description: DESCRIPTION,
    siteName: '문화산책',
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: '문화산책 - 전국 문화행사 둘러보기',
        type: 'image/png',
      },
      {
        url: SEARCH_THUMBNAIL_URL,
        width: 1200,
        height: 1200,
        alt: '문화산책 전국 문화행사 검색 대표 이미지',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE_URL],
  },
};

const HomePage = () => <FeedView />;

export default HomePage;
