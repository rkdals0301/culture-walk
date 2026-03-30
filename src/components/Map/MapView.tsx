'use client';

import Loader from '@/components/Loader/Loader';
import { useCultures } from '@/hooks/cultureHooks';
import { getCultures } from '@/selectors/cultureSelectors';
import { FormattedCulture } from '@/types/culture';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

// selector import
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';

import googleMapNightMode from '../../../public/assets/google-map-night-mode.json';

const MapZoomControls = dynamic(() => import('@/components/Map/MapZoomControls'), { ssr: false });
const MapFindMyLocationControl = dynamic(() => import('@/components/Map/MapFindMyLocationControl'), { ssr: false });
const MapMarker = dynamic(() => import('@/components/Map/MapMarker'), { ssr: false });

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const MapUnavailableState = () => (
  <div className='flex size-full items-center justify-center p-4 sm:p-6'>
    <div className='surface-panel flex w-full max-w-2xl flex-col gap-4 rounded-[32px] p-6 text-[var(--app-text)] sm:p-8'>
      <p className='text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#1f765f] dark:text-[#8dc5b5]'>
        Map Preview Unavailable
      </p>
      <h2 className='text-3xl font-semibold tracking-[-0.05em] sm:text-4xl'>Google Maps 키가 설정되지 않았습니다.</h2>
      <p className='max-w-xl text-sm leading-6 text-[var(--app-muted)] sm:text-base'>
        현재 로컬에서는 지도 타일을 불러오지 못하지만, 새로 바꾼 레이아웃과 탐색 패널 구조는 그대로 확인할 수 있습니다.
        `.env`에 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`를 넣으면 실제 지도가 바로 활성화됩니다.
      </p>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='surface-card rounded-[24px] p-4'>
          <p className='text-sm font-semibold'>필수 환경 변수</p>
          <p className='mt-2 break-all text-sm text-[var(--app-muted)]'>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
        </div>
        <div className='surface-card rounded-[24px] p-4'>
          <p className='text-sm font-semibold'>현재 상태</p>
          <p className='mt-2 text-sm text-[var(--app-muted)]'>지도는 비활성화, UI 셸은 정상 렌더</p>
        </div>
      </div>
    </div>
  </div>
);

const MapCanvas = () => {
  const { resolvedTheme } = useTheme();
  const { isLoading, error } = useCultures();
  const params = useParams(); // 동적 경로 매개변수 가져오기
  const id = params?.id; // URL의 id 가져오기

  const [currentId, setCurrentId] = useState<number | null>(null); // 선택된 문화 ID 상태
  const cultures = useSelector(getCultures); // 전체 문화 데이터 가져오기

  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [centerPosition, setCenterPosition] = useState<{ lat: number; lng: number }>({ lat: 37.5665, lng: 126.978 });
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);

  const { isLoaded: mapLoaded, loadError: mapLoadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY as string,
    language: 'ko',
    region: 'KR',
    preventGoogleFontsLoading: true,
  });

  useEffect(() => {
    if (mapInstance) {
      mapInstance.panTo(centerPosition);
    }
  }, [mapInstance, centerPosition]);

  // URL에서 가져온 id로 중심 설정
  useEffect(() => {
    const idValue = Array.isArray(id) ? id[0] : id;
    const idNum = idValue ? parseInt(idValue, 10) : NaN;

    if (idNum && cultures.length > 0) {
      const selectedCulture = cultures.find(culture => culture.id === idNum);
      if (selectedCulture) {
        setCenterPosition({ lat: selectedCulture.lat, lng: selectedCulture.lng });
        setActiveMarkerId(idNum);
        setCurrentId(idNum);
      } else {
        setCurrentId(null); // 선택된 문화 ID 업데이트
        setActiveMarkerId(null);
      }
    } else {
      setCurrentId(null); // 선택된 문화 ID 업데이트
      setActiveMarkerId(null);
    }
  }, [id, cultures]);

  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMapInstance(mapInstance);
  }, []);

  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    setCenterPosition({ lat, lng });
  }, []);

  // 중복된 마커를 미리 계산하여 캐싱
  const duplicateCulturesMap = useMemo(() => {
    const duplicates: { [key: string]: FormattedCulture[] } = {};
    cultures.forEach(culture => {
      const key = `${culture.lat}-${culture.lng}`;
      if (!duplicates[key]) {
        duplicates[key] = [];
      }
      duplicates[key].push(culture);
    });
    return duplicates;
  }, [cultures]);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      clickableIcons: false,
      zoom: 12,
      styles: resolvedTheme === 'dark' ? googleMapNightMode : null,
    }),
    [resolvedTheme]
  );

  if (!mapLoaded || isLoading) {
    return (
      <div className='size-full'>
        <Loader />
      </div>
    );
  }

  if (mapLoadError) {
    return (
      <div className='flex size-full items-center justify-center p-4 sm:p-6'>
        <div className='surface-panel w-full max-w-xl rounded-[32px] p-6 text-[var(--app-text)] sm:p-8'>
          <p className='text-lg font-semibold tracking-[-0.03em]'>지도를 불러오지 못했습니다.</p>
          <p className='mt-2 text-sm leading-6 text-[var(--app-muted)]'>
            Google Maps 스크립트 로드에 실패했습니다. API 키와 도메인 허용 설정을 확인하세요.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex size-full items-center justify-center p-4 sm:p-6'>
        <div className='surface-panel w-full max-w-xl rounded-[32px] p-6 text-[var(--app-text)] sm:p-8'>
          <p className='text-lg font-semibold tracking-[-0.03em]'>행사 데이터를 불러오지 못했습니다.</p>
          <p className='mt-2 text-sm leading-6 text-[var(--app-muted)]'>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap mapContainerClassName='size-full' options={mapOptions} center={centerPosition} onLoad={handleMapLoad}>
      {cultures.map(culture => (
        <MapMarker
          key={culture.id}
          duplicateCultures={duplicateCulturesMap[`${culture.lat}-${culture.lng}`]}
          culture={culture}
          isSelected={activeMarkerId === culture.id}
          setActiveMarkerId={setActiveMarkerId}
          setCenterPosition={setCenterPosition}
          id={currentId} // 현재 ID를 MapMarker에 전달
          totalCulturesLength={cultures.length}
        />
      ))}
      {currentLocation && (
        <MarkerF
          title='현재 위치'
          position={currentLocation}
          icon={{
            url: '/assets/images/map-marker-current-location-icon.svg',
            scaledSize: new google.maps.Size(40, 40),
          }}
        />
      )}
      <MapFindMyLocationControl onLocationUpdate={handleLocationUpdate} />
      <MapZoomControls map={mapInstance} />
    </GoogleMap>
  );
};

const MapView = () => {
  if (!GOOGLE_MAPS_API_KEY) {
    return <MapUnavailableState />;
  }

  return <MapCanvas />;
};

export default React.memo(MapView);
