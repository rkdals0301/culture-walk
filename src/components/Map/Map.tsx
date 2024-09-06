'use client';

import { useEffect, useRef } from 'react';

const Map = () => {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Naver 지도 스크립트 로드
    const script = document.createElement('script');
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=7r4k992itu`;
    script.onload = () => {
      if (mapContainer.current) {
        const map = new window.naver.maps.Map(mapContainer.current, {
          center: new window.naver.maps.LatLng(37.5665, 126.978), // 서울의 좌표
          zoom: 10,
        });

        new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(37.5665, 126.978),
          map: map,
        });
      }
    };
    document.head.appendChild(script);

    // Cleanup on component unmount
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
};

export default Map;
