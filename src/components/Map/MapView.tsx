'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { FormattedCulture } from '@/types/culture';
import Loader from '@/components/Loader/Loader';
import styles from './MapView.module.scss';
import { useCultures } from '@/hooks/cultureHooks';

const MapZoomControls = dynamic(() => import('@/components/Map/MapZoomControls'), { ssr: false });
const MapFindMyLocationControl = dynamic(() => import('@/components/Map/MapFindMyLocationControl'), { ssr: false });
const MapMarker = dynamic(() => import('@/components/Map/MapMarker'), { ssr: false });

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const MapView = () => {
  const router = useRouter();
  const { isLoading, error } = useCultures();
  const { id } = useParams(); // URL의 id 가져오기

  const { cultures } = useSelector((state: RootState) => state.culture);

  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [centerPosition, setCenterPosition] = useState<{ lat: number; lng: number }>({ lat: 37.5665, lng: 126.978 });
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);
  const [activeInfoWindowId, setActiveInfoWindowId] = useState<number | null>(null);
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
    if (id && typeof id === 'string' && cultures.length > 0) {
      const selectedCulture = cultures.find(culture => culture.id === parseInt(id, 10));
      if (selectedCulture) {
        const { lat, lng } = selectedCulture;
        setCenterPosition({ lat, lng });
        setActiveMarkerId(parseInt(id, 10));
        setActiveInfoWindowId(null);
      }
    } else {
      setActiveMarkerId(null);
      setActiveInfoWindowId(null);
    }
  }, [id, cultures]);

  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    setMapInstance(mapInstance);
  }, []);

  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    setCurrentLocation({ lat, lng });
    setCenterPosition({ lat, lng });
  }, []);

  const handleMarkerClick = useCallback(
    (culture: FormattedCulture) => {
      const { lat, lng } = culture;
      const newCenter = { lat, lng };
      setCenterPosition(newCenter);
      setActiveMarkerId(culture.id);

      router.push(`/map/${culture.id}`, { scroll: false });
    },
    [router]
  );

  const isMarkerDuplicated = useCallback(
    (lat: number, lng: number) => {
      return cultures.filter(culture => culture.lat === lat && culture.lng === lng).length > 1;
    },
    [cultures]
  );

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      clickableIcons: false,
      zoom: 12,
    }),
    []
  );

  if (mapLoadError) {
    return <div className={styles['map-view']}>Error loading maps</div>;
  }

  if (!mapLoaded || isLoading) {
    return (
      <div className={styles['map-view']}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div className={styles['map-view']}>에러: {error.message}</div>;
  }

  return (
    <div className={styles['map-view']}>
      <GoogleMap mapContainerClassName={styles.map} options={mapOptions} center={centerPosition} onLoad={handleMapLoad}>
        {cultures.map(culture => (
          <MapMarker
            key={culture.id}
            cultures={cultures}
            culture={culture}
            isSelected={activeMarkerId === culture.id}
            isDuplicated={isMarkerDuplicated(culture.lat, culture.lng)}
            activeInfoWindowId={activeInfoWindowId}
            onClick={handleMarkerClick}
            setActiveInfoWindowId={setActiveInfoWindowId}
          />
        ))}
        {currentLocation && (
          <MarkerF
            title='현재 위치'
            position={currentLocation}
            icon={{
              url: '/assets/marker-current-location-icon.svg',
              scaledSize: new google.maps.Size(40, 40),
            }}
          />
        )}
        <MapFindMyLocationControl onLocationUpdate={handleLocationUpdate} />
        <MapZoomControls map={mapInstance} />
      </GoogleMap>
    </div>
  );
};

export default React.memo(MapView);
