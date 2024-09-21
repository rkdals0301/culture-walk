'use client';

import React, { useState, useCallback } from 'react';
import { MarkerF } from '@react-google-maps/api';
import { FormattedCulture } from '@/types/culture';
import MapInfoWindow from '@/components/Map/MapInfoWindow';

interface MapMarkerProps {
  duplicateCultures: FormattedCulture[]; // 중복 여부를 Prop으로 전달받음
  culture: FormattedCulture;
  isSelected: boolean; // 선택 여부를 Prop으로 전달받음
  activeInfoWindowId: number | null;
  onClick: (culture: FormattedCulture) => void;
  setActiveInfoWindowId: (id: number | null) => void;
}

const MapMarker = ({
  duplicateCultures,
  culture,
  isSelected,
  activeInfoWindowId,
  onClick,
  setActiveInfoWindowId,
}: MapMarkerProps) => {
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  const onLoad = useCallback((markerInstance: google.maps.Marker) => {
    setMarker(markerInstance); // MarkerF가 로드되면 marker 객체를 저장
  }, []);

  const position = {
    lat: culture.lat,
    lng: culture.lng,
  };

  const handleMarkerClick = useCallback(() => {
    if (duplicateCultures.length > 1) {
      setActiveInfoWindowId(culture.id);
    } else {
      setActiveInfoWindowId(null);
      onClick(culture);
    }
  }, [duplicateCultures, culture, onClick, setActiveInfoWindowId]);

  const handleInfoWindowClick = useCallback(
    (culture: FormattedCulture) => {
      setActiveInfoWindowId(null);
      onClick(culture);
    },
    [onClick, setActiveInfoWindowId]
  );

  const iconUrl = isSelected ? '/assets/marker-selected-icon.svg' : '/assets/marker-default-icon.svg';
  const iconSize = isSelected ? new google.maps.Size(40, 40) : new google.maps.Size(35, 35);

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
      onLoad={onLoad} // MarkerF가 로드될 때 호출
    >
      {activeInfoWindowId === culture.id && (
        <MapInfoWindow
          anchor={marker || undefined} // marker가 null이면 undefined로 설정
          cultures={duplicateCultures}
          onCultureClick={handleInfoWindowClick}
          onClose={() => setActiveInfoWindowId(null)}
        />
      )}
    </MarkerF>
  );
};

export default React.memo(MapMarker);
