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
          <div className='flex flex-col gap-4'>
            <div>
              <p className='text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#1f765f] dark:text-[#8dc5b5]'>
                Shared Place
              </p>
              <h3 className='mt-2 text-xl font-semibold tracking-[-0.03em]'>같은 위치에서 여러 행사가 열리고 있습니다.</h3>
              <p className='mt-2 text-sm leading-6 text-[var(--app-muted)]'>
                아래 목록에서 원하는 행사를 골라 상세 바텀시트로 이동할 수 있습니다.
              </p>
            </div>
            <ul className='grid gap-2'>
              {duplicateCultures.map(dupCulture => (
                <li
                  className='surface-card cursor-pointer rounded-[22px] p-4 font-semibold tracking-[-0.02em] transition duration-200 hover:-translate-y-0.5 hover:border-[#1f765f]/20 hover:shadow-[0_24px_48px_-30px_rgba(31,118,95,0.45)]'
                  key={dupCulture.id}
                  onClick={() => handleGoToMapDetail(dupCulture.id)}
                >
                  <p>{dupCulture.title}</p>
                  <p className='mt-1 text-sm font-medium text-[var(--app-muted)]'>{dupCulture.displayDate}</p>
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
