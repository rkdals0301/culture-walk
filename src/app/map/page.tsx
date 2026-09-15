import type { Metadata } from 'next';

import MapShell from '@/components/Map/MapShell';
import { getWorkerEnv } from '@/server/cloudflare';
import { createPageSocialMetadata } from '@/utils/siteMetadata';

const TITLE = '전국 문화행사 지도 | 문화산책';
const DESCRIPTION = '전국의 축제·공연·전시·체험 정보를 지도에서 탐색하고, 지역별 일정과 장소를 빠르게 확인하세요.';

export const metadata: Metadata = {
  title: {
    absolute: TITLE,
  },
  description: DESCRIPTION,
  alternates: {
    canonical: '/map',
  },
  ...createPageSocialMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: '/map',
    imageAlt: '문화산책 - 전국 문화행사 지도',
  }),
};

export const dynamic = 'force-dynamic';

const MapPage = async () => {
  const env = await getWorkerEnv();
  return <MapShell kakaoMapAppKey={env.KAKAO_MAP_APP_KEY} />;
};

export default MapPage;
