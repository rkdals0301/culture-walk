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

import mapNightMode from '../../../public/mapStyles/night-mode.json';

const MapZoomControls = dynamic(() => import('@/components/Map/MapZoomControls'), { ssr: false });
const MapFindMyLocationControl = dynamic(() => import('@/components/Map/MapFindMyLocationControl'), { ssr: false });
const MapMarker = dynamic(() => import('@/components/Map/MapMarker'), { ssr: false });

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const MapView = () => {
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

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error('Google Maps API key is missing in the environment variables');
  }

  const { isLoaded: mapLoaded, loadError: mapLoadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: 'ko',
    region: 'KR',
  });

  useEffect(() => {
    if (mapInstance) {
      mapInstance.panTo(centerPosition);
    }
  }, [mapInstance, centerPosition]);

  // URL에서 가져온 id로 중심 설정
  useEffect(() => {
    const idNum = Array.isArray(id) ? parseInt(id[0], 10) : parseInt(id, 10); // id가 숫자 형태로 변환된 경우

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
      styles: resolvedTheme === 'dark' ? mapNightMode : null,
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
    return <div className='size-full'>Error loading maps</div>;
  }

  if (error) {
    return <div className='size-full'>에러: {error.message}</div>;
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
            url: '/assets/map-marker-current-location-icon.svg',
            scaledSize: new google.maps.Size(40, 40),
          }}
        />
      )}
      <MapFindMyLocationControl onLocationUpdate={handleLocationUpdate} />
      <MapZoomControls map={mapInstance} />
    </GoogleMap>
  );
};

export default React.memo(MapView);
