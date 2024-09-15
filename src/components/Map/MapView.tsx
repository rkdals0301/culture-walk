'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { useSelector, useDispatch } from 'react-redux';
import styles from './MapView.module.scss';
import { RootState, AppDispatch } from '@/store';
import { loadCultures } from '@/slices/culturesSlice';
import Loader from '@/components/Common/Loader/Loader';

const MapZoomControls = dynamic(() => import('@/components/Map/MapZoomControls'), { ssr: false });
const MapFindMyLocationControl = dynamic(() => import('@/components/Map/MapFindMyLocationControl'), { ssr: false });
const MapMarker = dynamic(() => import('@/components/Map/MapMarker'), { ssr: false });

const MapView = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { cultures, loading: loadingData, error } = useSelector((state: RootState) => state.culture);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 37.5665, lng: 126.978 });
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCeYUfoW9AIjh0ZAAwC1AeY6JBvl78omI4',
    language: 'ko',
    region: 'KR',
  });

  useEffect(() => {
    if (cultures.length === 0) {
      dispatch(loadCultures());
    }
  }, [cultures.length, dispatch]);

  useEffect(() => {
    if (map && location) {
      map.panTo(new google.maps.LatLng(location.lat, location.lng));
      map.setZoom(12);
    }
  }, [map, location]);

  const handleLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const handleLocationUpdate = useCallback((lat: number, lng: number) => {
    setLocation({ lat, lng });
    setMapCenter({ lat, lng });
  }, []);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      clickableIcons: false,
    }),
    []
  );

  if (loadError) {
    return <div>Error loading maps</div>;
  }

  if (!isLoaded || loadingData) {
    return (
      <div className={styles['map-view']}>
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles['map-view']}>
      <GoogleMap
        mapContainerClassName={styles.map}
        options={mapOptions}
        center={mapCenter}
        zoom={12}
        clickableIcons={false}
        onLoad={handleLoad}
      >
        {cultures.map(culture => (
          <MapMarker key={culture.id} culture={culture} />
        ))}
        {location && (
          <MarkerF
            position={location}
            icon={{
              url: '/assets/marker-current-location-icon.svg',
              scaledSize: new google.maps.Size(40, 40),
            }}
          />
        )}
        <MapFindMyLocationControl onLocationUpdate={handleLocationUpdate} />
        <MapZoomControls map={map} />
      </GoogleMap>
    </div>
  );
};

export default React.memo(MapView);
