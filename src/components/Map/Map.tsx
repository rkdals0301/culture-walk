'use client';

import React from 'react';
// import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

const Map = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCeYUfoW9AIjh0ZAAwC1AeY6JBvl78omI4',
    language: 'ko',
    region: 'KR', // 한국 지역 설정
  });
  // const [map, setMap] = useState<google.maps.Map | null>(null);

  // const onLoad = useCallback((map: google.maps.Map) => {
  //   setMap(map);
  // }, []);

  // const onUnmount = useCallback(() => {
  //   setMap(null);
  // }, []);

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      options={{
        disableDefaultUI: true, // 기본 UI 요소 모두 숨김
        zoomControl: true, // 줌 컨트롤만 표시
      }}
      center={{
        lat: 37.715133,
        lng: 126.734086,
      }}
      zoom={12}
      clickableIcons={false}
      // onLoad={onLoad}
      // onUnmount={onUnmount}
    >
      {/* 자식 컴포넌트, 예를 들어 마커, 정보 창 등을 추가하세요 */}
    </GoogleMap>
  );
};

export default React.memo(Map);
