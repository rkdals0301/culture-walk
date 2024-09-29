'use client';

import React, { useCallback } from 'react';
import styles from './MapZoomControls.module.scss';
import MapAddIcon from '../../../public//assets/map-add-icon.svg';
import MapRemoveIcon from '../../../public//assets/map-remove-icon.svg';

interface MapZoomControlsProps {
  map: google.maps.Map | null; // Google Map 객체를 받을 prop
}

const MapZoomControls = ({ map }: MapZoomControlsProps) => {
  const handleZoomIn = useCallback(() => {
    if (map) {
      const zoomLevel = map.getZoom();
      if (typeof zoomLevel === 'number') {
        map.setZoom(zoomLevel + 1); // Zoom in by increasing zoom level
      } else {
        console.error('Zoom level is undefined or not a number');
      }
    }
  }, [map]);

  const handleZoomOut = useCallback(() => {
    if (map) {
      const zoomLevel = map.getZoom();
      if (typeof zoomLevel === 'number') {
        map.setZoom(zoomLevel - 1); // Zoom out by decreasing zoom level
      } else {
        console.error('Zoom level is undefined or not a number');
      }
    }
  }, [map]);

  return (
    <div className={styles['map-zoom-controls']}>
      <button aria-label='지도 확대' className={styles['zoom-in-button']} onClick={handleZoomIn}>
        <MapAddIcon />
      </button>
      <button aria-label='지도 축소' className={styles['zoom-out-button']} onClick={handleZoomOut}>
        <MapRemoveIcon />
      </button>
    </div>
  );
};

export default React.memo(MapZoomControls);
