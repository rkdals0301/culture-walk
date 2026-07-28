import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: {
    absolute: '문화산책 | 전국 문화행사 지도',
  },
  description: '전국의 축제·공연·전시·체험 정보를 지도에서 탐색하고 상세 정보를 확인하세요.',
  alternates: {
    canonical: '/map',
  },
};

const HomePage = () => redirect('/map');

export default HomePage;
