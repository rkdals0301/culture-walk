'use client';

import { preconnect, preload } from 'react-dom';

import {
  createKakaoMapsSdkUrl,
  isValidKakaoMapsAppKey,
  KAKAO_MAPS_SDK_ORIGIN,
} from '@/utils/kakaoMapsSdk';

const KAKAO_MAPS_TILE_ORIGINS = ['https://t1.daumcdn.net', 'https://mts.daumcdn.net'] as const;

interface MapResourceHintsProps {
  kakaoMapAppKey?: string | null;
}

const MapResourceHints = ({ kakaoMapAppKey }: MapResourceHintsProps) => {
  const normalizedAppKey = kakaoMapAppKey?.trim() ?? '';
  if (!isValidKakaoMapsAppKey(normalizedAppKey)) {
    return null;
  }

  preconnect(KAKAO_MAPS_SDK_ORIGIN);
  KAKAO_MAPS_TILE_ORIGINS.forEach(origin => preconnect(origin));
  preload(createKakaoMapsSdkUrl(normalizedAppKey), { as: 'script' });

  return null;
};

export default MapResourceHints;
