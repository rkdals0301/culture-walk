import MapDashboard from '@/components/Map/MapDashboard';

import type { Metadata } from 'next';

const SITE_URL = process.env.SITE_URL || process.env.APP_BASE_URL || 'https://culturewalk.gangmin.dev';
const OG_IMAGE_URL = `${SITE_URL}/assets/images/og-image.png?v=20260715`;
const SEARCH_THUMBNAIL_URL = `${SITE_URL}/assets/images/search-thumbnail.png?v=20260715`;
const TITLE = '문화산책 | 전국 문화행사 지도';
const DESCRIPTION = '전국 문화행사를 지도에서 탐색하고 지역별 행사 정보를 빠르게 확인하세요.';

export const metadata: Metadata = {
  title: {
    absolute: TITLE,
  },
  description: DESCRIPTION,
  alternates: {
    canonical: '/map',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/map',
    title: TITLE,
    description: DESCRIPTION,
    siteName: '문화산책',
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: '문화산책 - 전국 문화행사 지도',
        type: 'image/png',
      },
      {
        url: SEARCH_THUMBNAIL_URL,
        width: 1200,
        height: 1200,
        alt: '문화산책 전국 문화행사 지도 검색 대표 이미지',
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

const MapPage = () => {
  return <MapDashboard />;
};

export default MapPage;
