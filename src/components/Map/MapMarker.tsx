'use client';

import React, { useCallback } from 'react';
import { MarkerF } from '@react-google-maps/api';
import { useParams } from 'next/navigation';
import { FormattedCulture } from '@/types/culture';
import { useRouter } from 'next/navigation';

interface MapMarkerProps {
  culture: FormattedCulture;
  // clusterer?: MarkerClusterer;
}

// const MapMarker = ({ culture, clusterer }: MapMarkerProps) => {
const MapMarker = ({ culture }: MapMarkerProps) => {
  const { id } = useParams(); // URL에서 ID 추출
  const router = useRouter();
  const offset = 0.00005 * (culture.id % 10); // index에 따라 오프셋을 조정 (10개의 그룹으로 나누어 각 그룹 내에서 위치 조정)
  const position = {
    lat: +culture.lat + offset,
    lng: +culture.lng + offset,
  };

  const handleOnClick = useCallback(() => {
    router.push(`/map/${culture.id}`, { scroll: false });
  }, [culture.id, router]);

  return (
    <MarkerF
      title={culture.title}
      position={position}
      onClick={handleOnClick}
      icon={{
        url: +id === culture.id ? '/assets/marker-selected-icon.svg' : '/assets/marker-default-icon.svg', // 선택 시와 기본 상태의 아이콘 설정
        scaledSize: new google.maps.Size(40, 40), // 아이콘 크기 조정 (옵션)
      }}
      // clusterer={clusterer}
    />
  );
};

export default React.memo(MapMarker);
