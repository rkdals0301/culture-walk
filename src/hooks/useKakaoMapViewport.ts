import type { CultureMapViewport, FormattedCulture } from '@/types/culture';
import type { MapCameraState } from '@/utils/exploreState';
import type { GeoPoint } from '@/utils/geo';

import { useCallback, useEffect, useRef } from 'react';

interface UseKakaoMapViewportOptions {
  mapInstance: kakao.maps.Map | null;
  selectedCultureId: number | null;
  selectedCulture: FormattedCulture | null;
  currentLocation: GeoPoint | null;
  onViewportChange: (viewport: CultureMapViewport) => void;
  onCameraChange?: (camera: MapCameraState) => void;
}

export const useKakaoMapViewport = ({
  mapInstance,
  selectedCultureId,
  selectedCulture,
  currentLocation,
  onViewportChange,
  onCameraChange,
}: UseKakaoMapViewportOptions) => {
  const selectedCultureIdRef = useRef<number | null>(selectedCultureId);

  useEffect(() => {
    selectedCultureIdRef.current = selectedCultureId;
  }, [selectedCultureId]);

  const panTo = useCallback(
    (location: GeoPoint) => {
      if (!mapInstance || !window.kakao?.maps) return;
      mapInstance.panTo(new window.kakao.maps.LatLng(location.lat, location.lng));
    },
    [mapInstance]
  );

  useEffect(() => {
    if (!selectedCulture || !mapInstance || !window.kakao?.maps) return;

    panTo({ lat: selectedCulture.lat, lng: selectedCulture.lng });
    if (mapInstance.getLevel() > 4) {
      mapInstance.setLevel(4);
    }
  }, [mapInstance, panTo, selectedCulture]);

  useEffect(() => {
    if (!currentLocation || selectedCultureIdRef.current || !mapInstance || !window.kakao?.maps) return;

    panTo(currentLocation);
    if (mapInstance.getLevel() > 4) {
      mapInstance.setLevel(4);
    }
  }, [currentLocation, mapInstance, panTo]);

  useEffect(() => {
    if (!mapInstance || !window.kakao?.maps) return;

    let publishTimer: number | null = null;
    const publishCamera = () => {
      const center = mapInstance.getCenter();
      const camera = {
        lat: center.getLat(),
        lng: center.getLng(),
        level: mapInstance.getLevel(),
      };
      if (Number.isFinite(camera.lat) && Number.isFinite(camera.lng)) {
        onCameraChange?.(camera);
      }
    };
    const publishBounds = () => {
      const bounds = mapInstance.getBounds();
      const southWest = bounds.getSouthWest();
      const northEast = bounds.getNorthEast();
      const nextViewport: CultureMapViewport = {
        bounds: {
          swLat: southWest.getLat(),
          swLng: southWest.getLng(),
          neLat: northEast.getLat(),
          neLng: northEast.getLng(),
        },
        level: mapInstance.getLevel(),
      };

      if (Object.values(nextViewport.bounds).every(value => Number.isFinite(value))) {
        onViewportChange(nextViewport);
      }
    };
    const handleIdle = () => {
      publishCamera();
      if (publishTimer !== null) window.clearTimeout(publishTimer);
      publishTimer = window.setTimeout(publishBounds, 250);
    };

    window.kakao.maps.event.addListener(mapInstance, 'idle', handleIdle);
    handleIdle();
    return () => {
      if (publishTimer !== null) window.clearTimeout(publishTimer);
      window.kakao?.maps.event.removeListener(mapInstance, 'idle', handleIdle);
    };
  }, [mapInstance, onCameraChange, onViewportChange]);

  return { panTo };
};
