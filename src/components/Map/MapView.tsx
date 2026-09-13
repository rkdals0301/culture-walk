'use client';

import Loader from '@/components/Loader/Loader';
import MapFindMyLocationControl from '@/components/Map/MapFindMyLocationControl';
import MapDuplicateLocationSheet from '@/components/Map/MapDuplicateLocationSheet';
import MapStatus from '@/components/Map/MapStatus';
import MapZoomControls from '@/components/Map/MapZoomControls';
import { useBottomSheet } from '@/context/BottomSheetContext';
import { useCultureContext } from '@/context/CultureContext';
import { useKakaoMapInstance } from '@/hooks/useKakaoMapInstance';
import { useKakaoMapMarkers } from '@/hooks/useKakaoMapMarkers';
import { useKakaoMapViewport } from '@/hooks/useKakaoMapViewport';
import type { CultureMapCluster, CultureMapViewport, FormattedCultureListItem } from '@/types/culture';
import {
  getEffectiveMapSortMode,
  normalizeMapCameraState,
  parseMapExploreStateFromSearch,
} from '@/utils/exploreState';
import { getMapCamera, getMapListScrollTop, setMapCamera } from '@/utils/exploreNavigationMemory';
import { type CoordinateGroup, groupItemsByCoordinate } from '@/utils/mapMarkers';
import { createMapExploreUrl, getMapDetailId } from '@/utils/mapRoute';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { AlertCircle } from 'lucide-react';

type MarkerGroup = CoordinateGroup<FormattedCultureListItem>;

interface MapViewProps {
  visibleClusters: CultureMapCluster[];
  isClustered: boolean;
  visibleCultures: FormattedCultureListItem[];
  isLoading: boolean;
  error: Error | null;
  onViewportChange: (viewport: CultureMapViewport) => void;
  onContinueWithList?: () => void;
}

const MapView = ({
  visibleClusters,
  isClustered,
  visibleCultures,
  isLoading,
  error,
  onViewportChange,
  onContinueWithList,
}: MapViewProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { openBottomSheet } = useBottomSheet();

  const {
    mapRegion,
    currentLocation,
    searchQuery,
    mapCategory,
    mapFreeOnly,
    mapSortMode,
  } = useCultureContext();
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);
  const [pendingDetailId, setPendingDetailId] = useState<number | null>(null);
  const [initialCamera] = useState(() =>
    typeof window === 'undefined' ? null : parseMapExploreStateFromSearch(window.location.search)?.mapCamera ?? null
  );
  const { mapContainerRef, markerClustererRef, mapInstance, sdkError, isMapReady, retry } = useKakaoMapInstance({
    initialCamera,
  });

  const selectedCultureId = useMemo(() => {
    return getMapDetailId(pathname);
  }, [pathname]);

  const markerGroups = useMemo(() => groupItemsByCoordinate(visibleCultures), [visibleCultures]);
  const selectedCulture = useMemo(
    () => visibleCultures.find(culture => culture.id === selectedCultureId) ?? null,
    [selectedCultureId, visibleCultures]
  );
  const { panTo } = useKakaoMapViewport({
    mapInstance,
    selectedCultureId,
    selectedCulture,
    currentLocation,
    onViewportChange,
    onCameraChange: setMapCamera,
  });

  const getCurrentMapCamera = useCallback(() => {
    if (!mapInstance || !window.kakao?.maps) return getMapCamera();
    const center = mapInstance.getCenter();
    return normalizeMapCameraState({
      lat: center.getLat(),
      lng: center.getLng(),
      level: mapInstance.getLevel(),
    });
  }, [mapInstance]);

  const goToMapDetail = useCallback(
    (id: number) => {
      setPendingDetailId(id);
      setActiveMarkerId(id);
      const detailUrl = createMapExploreUrl(`/map/${id}`, {
        searchQuery,
        mapCategory,
        mapRegion,
        mapFreeOnly,
        sortMode: getEffectiveMapSortMode(mapSortMode, Boolean(currentLocation)),
        mapListScrollTop: getMapListScrollTop(),
        listOpen: false,
        mapCamera: getCurrentMapCamera(),
      });
      if (selectedCultureId !== null) {
        router.replace(detailUrl);
        return;
      }

      router.push(detailUrl);
    },
    [
      currentLocation,
      getCurrentMapCamera,
      mapCategory,
      mapFreeOnly,
      mapRegion,
      mapSortMode,
      router,
      searchQuery,
      selectedCultureId,
    ]
  );

  const handleServerClusterClick = useCallback(
    (cluster: CultureMapCluster) => {
      if (!mapInstance || !window.kakao?.maps) {
        return;
      }

      const position = new window.kakao.maps.LatLng(cluster.lat, cluster.lng);
      mapInstance.setLevel(Math.max(5, mapInstance.getLevel() - 4));
      mapInstance.panTo(position);
    },
    [mapInstance]
  );

  const handleMarkerGroupClick = useCallback(
    (group: MarkerGroup) => {
      if (group.duplicateItems.length === 1) {
        goToMapDetail(group.primaryItem.id);
        return;
      }

      setActiveMarkerId(group.primaryItem.id);
      panTo({ lat: group.lat, lng: group.lng });

      openBottomSheet({
        content: <MapDuplicateLocationSheet group={group} onSelectCulture={goToMapDetail} />,
        onClose: () => {
          setPendingDetailId(null);
          if (selectedCultureId === null) {
            setActiveMarkerId(null);
          }
        },
      });
    },
    [goToMapDetail, openBottomSheet, panTo, selectedCultureId]
  );

  useEffect(() => {
    setActiveMarkerId(selectedCultureId);
  }, [selectedCultureId]);

  useEffect(() => {
    if (pathname === '/map') {
      setPendingDetailId(null);
      return;
    }

    if (selectedCultureId && pendingDetailId === selectedCultureId) {
      setPendingDetailId(null);
    }
  }, [pathname, pendingDetailId, selectedCultureId]);

  useKakaoMapMarkers({
    mapInstance,
    markerClustererRef,
    markerGroups,
    visibleClusters,
    isClustered,
    selectedCultureId,
    focusedMarkerId: pendingDetailId ?? activeMarkerId,
    currentLocation,
    onClusterClick: handleServerClusterClick,
    onMarkerGroupClick: handleMarkerGroupClick,
  });

  if (sdkError) {
    return (
      <MapStatus kind='map-error' code={sdkError.code} onRetry={retry} onContinueWithList={onContinueWithList} />
    );
  }

  return (
    <div className='relative size-full'>
      <p id='culture-map-description' className='sr-only'>
        전국 문화행사 위치를 보여주는 지도입니다. 지도 대신 행사 목록에서 같은 정보를 확인할 수 있습니다.
      </p>
      <div
        ref={mapContainerRef}
        className='map-canvas size-full'
        role='region'
        aria-label='전국 문화행사 지도'
        aria-describedby='culture-map-description'
        style={{ pointerEvents: 'auto', touchAction: 'auto' }}
      />
      <div className='map-controls-safe absolute z-20 flex flex-col items-end gap-2'>
        <MapZoomControls map={mapInstance} />
        <MapFindMyLocationControl />
      </div>

      {!isMapReady && (
        <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[var(--color-map-loading-overlay)] backdrop-blur-[1px]'>
          <Loader />
        </div>
      )}

      {isMapReady && isLoading && (
        <div className='pointer-events-none absolute left-3 right-3 top-20 z-20 md:left-auto md:right-6 md:max-w-xs'>
          <div className='surface-panel rounded-lg px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)]'>
            행사 데이터를 불러오는 중입니다.
          </div>
        </div>
      )}

      {error && (
        <div
          className='status-callout status-callout-compact map-inline-status absolute z-20 text-sm'
          data-status='api-error'
          role='alert'
        >
          <span className='status-callout-icon' aria-hidden='true'>
            <AlertCircle className='size-4' strokeWidth={2} />
          </span>
          <div className='min-w-0'>
            <p className='font-semibold'>행사 데이터를 불러오지 못했습니다.</p>
            <p className='mt-1 text-xs leading-5 text-[var(--color-text-secondary)]'>잠시 후 다시 시도해 주세요.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MapView);
