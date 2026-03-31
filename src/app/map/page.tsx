import MapDashboard from '@/components/Map/MapDashboard';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '서울 문화행사 지도',
  description: '서울시 문화행사를 지도에서 탐색하고 지역별 행사 정보를 빠르게 확인하세요.',
  alternates: {
    canonical: '/map',
  },
};

const MapPage = () => {
  return <MapDashboard />;
};

export default MapPage;
