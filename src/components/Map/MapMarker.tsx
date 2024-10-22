'use client';

import { useBottomSheet } from '@/context/BottomSheetContext';
import { FormattedCulture } from '@/types/culture';

import React, { useCallback, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { MarkerF } from '@react-google-maps/api';

interface MapMarkerProps {
  duplicateCultures: FormattedCulture[]; // 중복 여부를 Prop으로 전달받음
  culture: FormattedCulture;
  isSelected: boolean; // 선택 여부를 Prop으로 전달받음
  setActiveMarkerId: React.Dispatch<React.SetStateAction<number | null>>; // void가 아닌 올바른 타입 설정
  setCenterPosition: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }>>; // Props로 추가
  id: number | null;
  totalCulturesLength: number;
}

const MapMarker = ({
  duplicateCultures,
  culture,
  isSelected,
  setActiveMarkerId,
  setCenterPosition,
  totalCulturesLength,
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
      router.push(`/map/${activeId}`);
    },
    [router] // currentId를 의존성 배열에 추가
  );

  const handleMarkerClick = useCallback(() => {
    if (duplicateCultures.length > 1) {
      setActiveMarkerId(culture.id);
      setCenterPosition(position);

      openBottomSheet({
        content: (
          <div className='size-full overflow-y-auto'>
            <ul>
              {duplicateCultures.map(dupCulture => (
                <li
                  className='cursor-pointer rounded-lg bg-white p-2 font-semibold text-gray-900 hover:bg-gray-200 dark:bg-neutral-900 dark:text-gray-100 dark:hover:bg-neutral-700'
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
    handleGoToMapDetail,
    setCenterPosition,
  ]);

  const iconUrl = isSelected
    ? '/assets/images/map-marker-active-icon.svg'
    : '/assets/images/map-marker-default-icon.svg';
  const iconSize = isSelected ? new google.maps.Size(40, 40) : new google.maps.Size(32, 32);

  // 선택된 마커는 최상단에 위치, 그렇지 않으면 cultures.length와 culture.id에 기반한 zIndex 설정
  const zIndex = useMemo(
    () => (isSelected ? totalCulturesLength + 1 : totalCulturesLength - culture.id),
    [isSelected, totalCulturesLength, culture.id]
  );
  return (
    <MarkerF
      title={culture.title}
      options={{ optimized: true }}
      position={position}
      onClick={handleMarkerClick}
      icon={{
        url: iconUrl,
        scaledSize: iconSize,
      }}
      zIndex={zIndex}
    />
  );
};

export default React.memo(MapMarker);
