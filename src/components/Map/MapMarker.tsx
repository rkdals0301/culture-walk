'use client';

import React, { useCallback, useMemo } from 'react';
import { MarkerF, InfoWindowF } from '@react-google-maps/api';
import { FormattedCulture } from '@/types/culture';
import styles from './MapMarker.module.scss';

interface MapMarkerProps {
  cultures: FormattedCulture[]; // cultures를 prop으로 전달받기
  culture: FormattedCulture;
  isSelected: boolean; // 선택 여부를 Prop으로 전달받음
  isDuplicated: boolean; // 중복 여부를 Prop으로 전달받음
  activeInfoWindowId: number | null;
  onClick: (culture: FormattedCulture) => void;
  setActiveInfoWindowId: (id: number | null) => void;
  // clusterer?: MarkerClusterer;
}

// const MapMarker = ({ culture, clusterer }: MapMarkerProps) => {
const MapMarker = ({
  cultures,
  culture,
  isSelected,
  isDuplicated,
  activeInfoWindowId,
  onClick,
  setActiveInfoWindowId,
}: MapMarkerProps) => {
  // 중복된 위치의 문화 정보를 메모이제이션
  const duplicateCultures = useMemo(
    () => cultures.filter(c => c.lat === culture.lat && c.lng === culture.lng),
    [cultures, culture.lat, culture.lng]
  );
  // const offset = 0.00005 * (culture.id % 10); // index에 따라 오프셋을 조정 (10개의 그룹으로 나누어 각 그룹 내에서 위치 조정)
  // const position = {
  //   lat: +culture.lat + offset,
  //   lng: +culture.lng + offset,
  // };
  const position = {
    lat: culture.lat,
    lng: culture.lng,
  };

  const handleMarkerClick = useCallback(() => {
    if (isDuplicated) {
      setActiveInfoWindowId(culture.id);
    } else {
      setActiveInfoWindowId(null);
      onClick(culture);
    }
  }, [isDuplicated, culture, onClick, setActiveInfoWindowId]);

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
      // clusterer={clusterer}
    >
      {activeInfoWindowId === culture.id && (
        <InfoWindowF onCloseClick={() => setActiveInfoWindowId(null)}>
          <div className={styles['info-window-container']}>
            <ul className={styles['info-window-list']}>
              {duplicateCultures.map(c => (
                <li className={styles['info-window-list-item']} onClick={() => handleInfoWindowClick(c)} key={c.id}>
                  {c.title}
                </li>
              ))}
            </ul>
          </div>
        </InfoWindowF>
      )}
    </MarkerF>
  );
};

export default React.memo(MapMarker);
