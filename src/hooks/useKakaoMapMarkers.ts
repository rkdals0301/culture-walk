import type { CultureMapCluster, FormattedCultureListItem } from '@/types/culture';
import type { GeoPoint } from '@/utils/geo';
import type { CoordinateGroup } from '@/utils/mapMarkers';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const DEFAULT_MARKER_PIXEL_SIZE = 32;
const EMPHASIZED_MARKER_PIXEL_SIZE = 40;

interface UseKakaoMapMarkersOptions {
  mapInstance: kakao.maps.Map | null;
  markerClustererRef: RefObject<kakao.maps.MarkerClusterer | null>;
  markerGroups: CoordinateGroup<FormattedCultureListItem>[];
  visibleClusters: CultureMapCluster[];
  isClustered: boolean;
  selectedCultureId: number | null;
  focusedMarkerId: number | null;
  currentLocation: GeoPoint | null;
  onClusterClick: (cluster: CultureMapCluster) => void;
  onMarkerGroupClick: (group: CoordinateGroup<FormattedCultureListItem>) => void;
}

export const useKakaoMapMarkers = ({
  mapInstance,
  markerClustererRef,
  markerGroups,
  visibleClusters,
  isClustered,
  selectedCultureId,
  focusedMarkerId,
  currentLocation,
  onClusterClick,
  onMarkerGroupClick,
}: UseKakaoMapMarkersOptions) => {
  const markerRefs = useRef<kakao.maps.Marker[]>([]);
  const currentLocationMarkerRef = useRef<kakao.maps.Marker | null>(null);

  useEffect(() => {
    const markerClusterer = markerClustererRef.current;
    if (!mapInstance || !window.kakao?.maps || !markerClusterer) return;

    const useCluster = !isClustered && selectedCultureId === null;
    markerClusterer.clear();
    markerRefs.current.forEach(marker => marker.setMap(null));
    markerRefs.current = [];

    const kakaoMaps = window.kakao.maps;
    const selectionOverlays: kakao.maps.CustomOverlay[] = [];
    const serverClusterOverlays: Array<{
      element: HTMLButtonElement;
      handleClick: () => void;
      overlay: kakao.maps.CustomOverlay;
    }> = [];

    if (isClustered) {
      visibleClusters.forEach((cluster, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'map-server-cluster';
        button.textContent = cluster.count.toLocaleString();
        button.setAttribute('aria-label', `이 영역의 행사 ${cluster.count.toLocaleString()}개, 확대해서 보기`);
        button.title = '확대해서 행사 보기';

        const handleClick = () => onClusterClick(cluster);
        button.addEventListener('click', handleClick);

        const overlay = new kakaoMaps.CustomOverlay({
          map: mapInstance,
          position: new kakaoMaps.LatLng(cluster.lat, cluster.lng),
          content: button,
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: visibleClusters.length - index,
          clickable: true,
        });

        serverClusterOverlays.push({ element: button, handleClick, overlay });
      });

      return () => {
        serverClusterOverlays.forEach(({ element, handleClick, overlay }) => {
          element.removeEventListener('click', handleClick);
          overlay.setMap(null);
        });
      };
    }

    markerGroups.forEach((group, index) => {
      const isSelected =
        focusedMarkerId !== null && group.duplicateItems.some(culture => culture.id === focusedMarkerId);
      const iconUrl = isSelected
        ? '/assets/images/map-marker-active-icon.svg'
        : '/assets/images/map-marker-default-icon.svg';
      const markerPixelSize = isSelected ? EMPHASIZED_MARKER_PIXEL_SIZE : DEFAULT_MARKER_PIXEL_SIZE;
      const iconSize = new kakaoMaps.Size(markerPixelSize, markerPixelSize);

      const marker = new kakaoMaps.Marker({
        map: useCluster ? null : mapInstance,
        title: group.primaryItem.title,
        position: new kakaoMaps.LatLng(group.lat, group.lng),
        image: new kakaoMaps.MarkerImage(iconUrl, iconSize),
        zIndex: isSelected ? markerGroups.length + 1 : markerGroups.length - index,
        clickable: true,
      });

      kakaoMaps.event.addListener(marker, 'click', () => onMarkerGroupClick(group));

      if (isSelected) {
        selectionOverlays.push(
          new kakaoMaps.CustomOverlay({
            map: mapInstance,
            position: new kakaoMaps.LatLng(group.lat, group.lng),
            content: '<span class="map-marker-selection-pulse" aria-hidden="true"></span>',
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: markerGroups.length + 1,
            clickable: false,
          })
        );
      }

      markerRefs.current.push(marker);
    });

    if (useCluster) {
      markerClusterer.addMarkers(markerRefs.current);
    }

    return () => {
      markerClusterer.clear();
      selectionOverlays.forEach(overlay => overlay.setMap(null));
      markerRefs.current.forEach(marker => marker.setMap(null));
      markerRefs.current = [];
    };
  }, [
    focusedMarkerId,
    isClustered,
    mapInstance,
    markerClustererRef,
    markerGroups,
    onClusterClick,
    onMarkerGroupClick,
    selectedCultureId,
    visibleClusters,
  ]);

  useEffect(() => {
    if (!mapInstance || !window.kakao?.maps) return;

    currentLocationMarkerRef.current?.setMap(null);
    currentLocationMarkerRef.current = null;
    if (!currentLocation) return;

    const kakaoMaps = window.kakao.maps;
    const marker = new kakaoMaps.Marker({
      map: mapInstance,
      title: '현재 위치',
      position: new kakaoMaps.LatLng(currentLocation.lat, currentLocation.lng),
      image: new kakaoMaps.MarkerImage(
        '/assets/images/map-marker-current-location-icon.svg',
        new kakaoMaps.Size(EMPHASIZED_MARKER_PIXEL_SIZE, EMPHASIZED_MARKER_PIXEL_SIZE)
      ),
      zIndex: markerGroups.length + 2,
    });

    currentLocationMarkerRef.current = marker;
    return () => {
      marker.setMap(null);
      if (currentLocationMarkerRef.current === marker) {
        currentLocationMarkerRef.current = null;
      }
    };
  }, [currentLocation, mapInstance, markerGroups.length]);
};
