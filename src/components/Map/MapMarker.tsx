'use client';

import React, { useCallback, useMemo } from 'react';
import { MarkerF } from '@react-google-maps/api';
import { FormattedCulture } from '@/types/culture';
import { useBottomSheet } from '@/context/BottomSheetContext';
import styles from './MapMarker.module.scss';
import { useRouter } from 'next/navigation';

interface MapMarkerProps {
  duplicateCultures: FormattedCulture[]; // 중복 여부를 Prop으로 전달받음
  culture: FormattedCulture;
  isSelected: boolean; // 선택 여부를 Prop으로 전달받음
  setActiveMarkerId: React.Dispatch<React.SetStateAction<number | null>>; // void가 아닌 올바른 타입 설정
  setCenterPosition: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }>>; // Props로 추가
  id: number | null;
}

const MapMarker = ({
  duplicateCultures,
  culture,
  isSelected,
  setActiveMarkerId,
  setCenterPosition,
  id,
}: MapMarkerProps) => {
  const router = useRouter();
  const { openBottomSheet } = useBottomSheet(); // 바텀 시트를 위한 context 사용

  const position = useMemo(
    () => ({
      lat: culture.lat,
      lng: culture.lng,
    }),
    [culture.lat, culture.lng]
  );

  const handleGoToMapDetail = useCallback(
    (activeId: number) => {
      if (activeId === id) {
        router.push(`/map/${activeId}?timestamp=${Date.now()}`, { scroll: false });
      } else {
        router.push(`/map/${activeId}`, { scroll: false });
      }
    },
    [router, id] // currentId를 의존성 배열에 추가
  );

  const handleGoToMap = useCallback(() => {
    router.push(`/map`, { scroll: false }); // 바텀 시트 닫기 시, URL만 변경하고 상태는 유지
  }, [router]);

  const handleMarkerClick = useCallback(() => {
    if (duplicateCultures.length > 1) {
      setActiveMarkerId(culture.id);
      setCenterPosition(position);

      openBottomSheet({
        content: (
          <div className={styles['info-window-container']}>
            <ul className={styles['info-window-list']}>
              {duplicateCultures.map(dupCulture => (
                <li
                  className={styles['info-window-list-item']}
                  key={dupCulture.id}
                  onClick={() => handleGoToMapDetail(dupCulture.id)}
                >
                  {dupCulture.title}
                </li>
              ))}
            </ul>
          </div>
        ),
        onClose: () => {
          setActiveMarkerId(null);
          handleGoToMap();
        },
      });
    } else {
      handleGoToMapDetail(culture.id);
    }
  }, [
    duplicateCultures,
    culture,
    openBottomSheet,
    setActiveMarkerId,
    position,
    handleGoToMap,
    handleGoToMapDetail,
    setCenterPosition,
  ]);

  const iconUrl = isSelected ? '/assets/map-marker-active-icon.svg' : '/assets/map-marker-default-icon.svg';
  const iconSize = isSelected ? new google.maps.Size(40, 40) : new google.maps.Size(32, 32);

  return (
    <MarkerF
      title={culture.title}
      position={position}
      onClick={handleMarkerClick}
      icon={{
        url: iconUrl,
        scaledSize: iconSize,
      }}
      zIndex={isSelected ? 1 : 0} // 선택된 마커를 최상단에 표시
    />
  );
};

export default React.memo(MapMarker);
