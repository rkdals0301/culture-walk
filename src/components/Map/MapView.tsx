'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import styles from './MapView.module.scss';
import { FormattedCulture } from '@/types/culture';
import { formatCultureData } from '@/utils/cultureUtils';
import { fetchCultures } from '@/utils/api/culture';
import Loader from '@/components/Common/Loader/Loader';
import MapZoomControls from '@/components/Map/MapZoomControls';
import MapFindMyLocationControl from '@/components/Map/MapFindMyLocationControl';
import MapMarkerClusterer from '@/components/Map/MapMarkerClusterer';

const MapView = () => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [cultures, setCultures] = useState<FormattedCulture[]>([]); // 문화 리스트 상태
  const [loadingData, setLoadingData] = useState<boolean>(true); // 데이터 로딩 상태

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCeYUfoW9AIjh0ZAAwC1AeY6JBvl78omI4',
    language: 'ko',
    region: 'KR', // 한국 지역 설정
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchCultures(); // API로부터 문화 데이터를 가져옴
        const formattedCultures = formatCultureData(data);
        setCultures(formattedCultures);
      } catch (error) {
        console.error('Error fetching cultures:', error);
      } finally {
        setLoadingData(false); // 로딩 상태 업데이트
      }
    };

    fetchData();
  }, []);

  const handleLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
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

  if (!isLoaded || loadingData)
    return (
      <div className={styles['map-view']}>
        <Loader />
      </div>
    );

  return (
    <div className={styles['map-view']}>
      <GoogleMap
        mapContainerClassName={styles.map}
        options={mapOptions}
        center={{ lat: 37.5665, lng: 126.978 }}
        zoom={12}
        clickableIcons={false}
        onLoad={handleLoad}
      >
        <MapMarkerClusterer cultures={cultures} />
        <MapFindMyLocationControl map={map} />
        <MapZoomControls map={map} />
      </GoogleMap>
    </div>
  );
};

export default React.memo(MapView);
