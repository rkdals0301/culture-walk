import type { Metadata } from 'next';

import FeedView from '@/components/Feed/FeedView';
import { createPageSocialMetadata } from '@/utils/siteMetadata';

const TITLE = '전국 문화행사·축제·공연·전시 지도 | 문화산책';
const DESCRIPTION = '전국의 축제·공연·전시·체험 정보를 지도와 목록으로 살펴보고, 일정과 장소를 한눈에 확인하세요.';

export const metadata: Metadata = {
  title: {
    absolute: TITLE,
  },
  description: DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  ...createPageSocialMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: '/',
    imageAlt: '문화산책 - 전국 문화행사 지도',
  }),
};

const HomePage = () => <FeedView />;

export default HomePage;
