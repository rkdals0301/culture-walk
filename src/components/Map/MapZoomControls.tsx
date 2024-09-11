'use client';

import styles from './MapZoomControls.module.scss';

interface MapZoomControlsProps {
  map: google.maps.Map | null; // Google Map 객체를 받을 prop
}

const MapZoomControls = ({ map }: MapZoomControlsProps) => {
  const handleZoomIn = () => {
    if (map) {
      const zoomLevel = map.getZoom();
      if (typeof zoomLevel === 'number') {
        map.setZoom(zoomLevel + 1); // Zoom in by increasing zoom level
      } else {
        console.error('Zoom level is undefined or not a number');
      }
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const zoomLevel = map.getZoom();
      if (typeof zoomLevel === 'number') {
        map.setZoom(zoomLevel - 1); // Zoom in by increasing zoom level
      } else {
        console.error('Zoom level is undefined or not a number');
      }
    }
  };
  return (
    <div className={styles['map-zoom-controls']}>
      <button className={styles['zoom-in-button']} onClick={handleZoomIn}>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          style={{ width: '24px', height: '24px' }}
        >
          <path d='M12 5v14m7-7H5' />
        </svg>
      </button>
      <button className={styles['zoom-out-button']} onClick={handleZoomOut}>
        <svg
          xmlns='http://www.w3.org/2000/svg'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
          style={{ width: '24px', height: '24px' }}
        >
          <path d='M5 12h14' />
        </svg>
      </button>
    </div>
  );
};

export default MapZoomControls;
