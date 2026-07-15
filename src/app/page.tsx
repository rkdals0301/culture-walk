import MapDashboard from '@/components/Map/MapDashboard';
import MapShell from '@/components/Map/MapShell';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '전국 문화행사 지도',
  description: '전국의 축제·공연·전시·체험 정보를 지도에서 탐색하고 상세 정보를 확인하세요.',
  alternates: {
    canonical: '/map',
  },
};

const HomePage = () => {
  return (
    <MapShell>
      <MapDashboard />
    </MapShell>
  );
};

export default HomePage;
