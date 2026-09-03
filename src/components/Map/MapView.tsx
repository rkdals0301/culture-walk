'use client';

import Loader from '@/components/Loader/Loader';
import MapFindMyLocationControl from '@/components/Map/MapFindMyLocationControl';
import MapStatus from '@/components/Map/MapStatus';
import MapZoomControls from '@/components/Map/MapZoomControls';
import { useBottomSheet } from '@/context/BottomSheetContext';
import { useCultureContext } from '@/context/CultureContext';
import { useCultures } from '@/hooks/cultureHooks';
import { FormattedCulture } from '@/types/culture';
import { serializeMapExploreStateToSearch } from '@/utils/exploreState';
import { KakaoMapsSdkError, loadKakaoMapsSdk, resetKakaoMapsSdk } from '@/utils/kakaoMapsSdk';
import { getMapDetailId } from '@/utils/mapRoute';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { AlertCircle } from 'lucide-react';

const KAKAO_MAPS_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY;
const DEFAULT_MAP_CENTER = { lat: 36.35, lng: 127.8 };
const DEFAULT_MAP_LEVEL = 13;
const COMPACT_MAP_BREAKPOINT = '(max-width: 639px)';
const DEFAULT_MAP_PADDING = { top: 80, right: 80, bottom: 80, left: 80 };
const COMPACT_MAP_PADDING = { top: 96, right: 24, bottom: 96, left: 24 };
const DEFAULT_MARKER_PIXEL_SIZE = 32;
const EMPHASIZED_MARKER_PIXEL_SIZE = 40;
const CLUSTER_STYLES: Array<Record<string, string>> = [
  {
    width: '40px',
    height: '40px',
    lineHeight: '40px',
    background: 'var(--color-map-cluster)',
    border: '2px solid var(--color-map-cluster-border)',
    borderRadius: '999px',
    color: 'var(--color-map-cluster-text)',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: '12px',
    boxShadow: 'var(--color-map-cluster-shadow)',
  },
  {
    width: '48px',
    height: '48px',
    lineHeight: '48px',
    background: 'var(--color-map-cluster)',
    border: '2px solid var(--color-map-cluster-border)',
    borderRadius: '999px',
    color: 'var(--color-map-cluster-text)',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: '13px',
    boxShadow: 'var(--color-map-cluster-shadow)',
  },
  {
    width: '56px',
    height: '56px',
    lineHeight: '56px',
    background: 'var(--color-map-cluster-strong)',
    border: '2px solid var(--color-map-cluster-border)',
    borderRadius: '999px',
    color: 'var(--color-map-cluster-text)',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: '14px',
    boxShadow: 'var(--color-map-cluster-shadow)',
  },
];

interface MarkerGroup {
  duplicateCultures: FormattedCulture[];
  lat: number;
  lng: number;
  primaryCulture: FormattedCulture;
}

const getMedian = (values: number[]) => {
  const sortedValues = [...values].sort((left, right) => left - right);
  return sortedValues[Math.floor(sortedValues.length / 2)];
};

const getMarkerFocus = (groups: MarkerGroup[]) => {
  if (groups.length === 0) {
    return null;
  }

  return {
    lat: getMedian(groups.map(group => group.lat)),
    lng: getMedian(groups.map(group => group.lng)),
  };
};

interface MapViewProps {
  onContinueWithList?: () => void;
}

const MapView = ({ onContinueWithList }: MapViewProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { openBottomSheet } = useBottomSheet();

  const {
    cultures,
    mapCultures,
    mapRegion,
    currentLocation,
    searchQuery,
    mapCategory,
    mapFreeOnly,
    mapSortMode,
    mapListScrollTop,
  } = useCultureContext();
  const { isLoading, error } = useCultures();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<kakao.maps.Marker[]>([]);
  const markerClustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const currentLocationMarkerRef = useRef<kakao.maps.Marker | null>(null);
  // Route selection controls focus, but closing a detail must not retrigger viewport fitting.
  const selectedCultureIdRef = useRef<number | null>(null);

  const [mapInstance, setMapInstance] = useState<kakao.maps.Map | null>(null);
  const [centerPosition, setCenterPosition] = useState(DEFAULT_MAP_CENTER);
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);
  const [pendingDetailId, setPendingDetailId] = useState<number | null>(null);
  const [sdkError, setSdkError] = useState<KakaoMapsSdkError | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const selectedCultureId = useMemo(() => {
    return getMapDetailId(pathname);
  }, [pathname]);

  const markerGroups = useMemo(() => {
    const groupMap = new Map<string, MarkerGroup>();

    mapCultures.forEach(culture => {
      const key = `${culture.lat.toFixed(6)}:${culture.lng.toFixed(6)}`;
      const existing = groupMap.get(key);

      if (existing) {
        existing.duplicateCultures.push(culture);
        return;
      }

      groupMap.set(key, {
        lat: culture.lat,
        lng: culture.lng,
        primaryCulture: culture,
        duplicateCultures: [culture],
      });
    });

    return Array.from(groupMap.values());
  }, [mapCultures]);

  const goToMapDetail = useCallback(
    (id: number) => {
      setPendingDetailId(id);
      setActiveMarkerId(id);
      const serializedSearch = serializeMapExploreStateToSearch({
        searchQuery,
        mapCategory,
        mapRegion,
        mapFreeOnly,
        sortMode: currentLocation ? mapSortMode : mapSortMode === 'distance' ? 'date' : mapSortMode,
        mapListScrollTop,
        listOpen: false,
      });
      const detailPath = `/map/${id}${serializedSearch ? `?${serializedSearch}` : ''}`;
      if (selectedCultureId !== null) {
        router.replace(detailPath);
        return;
      }

      router.push(detailPath);
    },
    [
      currentLocation,
      mapCategory,
      mapFreeOnly,
      mapListScrollTop,
      mapRegion,
      mapSortMode,
      router,
      searchQuery,
      selectedCultureId,
    ]
  );

  const handleMarkerGroupClick = useCallback(
    (group: MarkerGroup) => {
      if (group.duplicateCultures.length === 1) {
        goToMapDetail(group.primaryCulture.id);
        return;
      }

      setActiveMarkerId(group.primaryCulture.id);
      setCenterPosition({ lat: group.lat, lng: group.lng });

      openBottomSheet({
        content: (
          <div className='flex flex-col gap-4'>
            <div>
              <p className='text-[0.68rem] font-semibold text-[var(--color-brand-primary)]'>같은 장소의 행사</p>
              <h3 className='mt-2 text-xl font-semibold'>같은 위치에서 여러 행사가 열리고 있습니다.</h3>
              <p className='mt-2 text-sm leading-6 text-[var(--color-text-secondary)]'>
                아래 목록에서 원하는 행사를 선택하면 상세 화면으로 이동합니다.
              </p>
            </div>
            <ul className='grid gap-2'>
              {group.duplicateCultures.map(culture => (
                <li key={culture.id}>
                  <button
                    type='button'
                    onClick={() => goToMapDetail(culture.id)}
                    className='surface-card w-full rounded-2xl p-4 text-left font-semibold transition duration-200 hover:border-[var(--color-border-brand)] hover:bg-[var(--color-interactive-hover)] hover:shadow-[var(--color-shadow-brand)] active:bg-[var(--color-interactive-active)]'
                  >
                    <p>{culture.title}</p>
                    <p className='mt-1 text-sm font-medium text-[var(--color-text-secondary)]'>{culture.displayDate}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ),
        onClose: () => {
          setPendingDetailId(null);
          if (selectedCultureId === null) {
            setActiveMarkerId(null);
          }
        },
      });
    },
    [goToMapDetail, openBottomSheet, selectedCultureId]
  );

  useEffect(() => {
    if (!selectedCultureId) {
      setActiveMarkerId(null);
      return;
    }

    setActiveMarkerId(selectedCultureId);
    const selectedCulture = cultures.find(culture => culture.id === selectedCultureId);
    if (selectedCulture) {
      setCenterPosition({ lat: selectedCulture.lat, lng: selectedCulture.lng });

      if (mapInstance && window.kakao?.maps) {
        const selectedPosition = new window.kakao.maps.LatLng(selectedCulture.lat, selectedCulture.lng);
        mapInstance.panTo(selectedPosition);
        if (mapInstance.getLevel() > 4) {
          mapInstance.setLevel(4);
        }
      }
    }
  }, [selectedCultureId, cultures, mapInstance]);

  useEffect(() => {
    selectedCultureIdRef.current = selectedCultureId;
  }, [selectedCultureId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(COMPACT_MAP_BREAKPOINT);
    const updateViewport = () => setIsCompactViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    if (pathname === '/map') {
      setPendingDetailId(null);
      return;
    }

    if (selectedCultureId && pendingDetailId === selectedCultureId) {
      setPendingDetailId(null);
    }
  }, [pathname, pendingDetailId, selectedCultureId]);

  useEffect(() => {
    let canceled = false;

    if (!KAKAO_MAPS_APP_KEY) {
      setSdkError(new KakaoMapsSdkError('missing-key'));
      return;
    }

    const initializeMap = async () => {
      try {
        await loadKakaoMapsSdk(KAKAO_MAPS_APP_KEY);

        if (canceled || !mapContainerRef.current || !window.kakao?.maps) {
          return;
        }

        const kakaoMaps = window.kakao.maps;
        const map = new kakaoMaps.Map(mapContainerRef.current, {
          center: new kakaoMaps.LatLng(DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng),
          level: DEFAULT_MAP_LEVEL,
          draggable: true,
          disableDoubleClick: false,
          disableDoubleClickZoom: false,
        });
        map.setDraggable(true);
        map.setZoomable(true);

        markerClustererRef.current = new kakaoMaps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 5,
          gridSize: 64,
          minClusterSize: 2,
          disableClickZoom: false,
          calculator: [10, 30],
          styles: CLUSTER_STYLES,
        });

        setMapInstance(map);
        setIsMapReady(true);
        setSdkError(null);
      } catch (error) {
        if (!canceled) {
          setSdkError(error instanceof KakaoMapsSdkError ? error : new KakaoMapsSdkError('sdk-error', error));
        }
      }
    };

    void initializeMap();

    return () => {
      canceled = true;
      markerClustererRef.current?.clear();
      markerClustererRef.current = null;
      markerRefs.current.forEach(marker => marker.setMap(null));
      markerRefs.current = [];
      currentLocationMarkerRef.current?.setMap(null);
      currentLocationMarkerRef.current = null;
      setMapInstance(null);
      setIsMapReady(false);
    };
  }, [retryNonce]);

  useEffect(() => {
    if (!mapInstance || !window.kakao?.maps) {
      return;
    }

    mapInstance.panTo(new window.kakao.maps.LatLng(centerPosition.lat, centerPosition.lng));
  }, [centerPosition, mapInstance]);

  useEffect(() => {
    if (
      !mapInstance ||
      !window.kakao?.maps ||
      selectedCultureIdRef.current ||
      currentLocation ||
      markerGroups.length === 0
    ) {
      return;
    }

    const bounds = new window.kakao.maps.LatLngBounds();
    markerGroups.forEach(group => bounds.extend(new window.kakao!.maps.LatLng(group.lat, group.lng)));
    const padding = isCompactViewport ? COMPACT_MAP_PADDING : DEFAULT_MAP_PADDING;
    mapInstance.setBounds(bounds, padding.top, padding.right, padding.bottom, padding.left);

    // Keep the full bounds for zoom, then center compact screens on the median marker
    // position so a small number of remote events does not pull the useful area off-center.
    if (isCompactViewport) {
      const focus = getMarkerFocus(markerGroups);
      if (focus) {
        mapInstance.panTo(new window.kakao.maps.LatLng(focus.lat, focus.lng));
      }
    }
  }, [currentLocation, isCompactViewport, mapInstance, mapRegion, markerGroups]);

  useEffect(() => {
    if (!currentLocation || selectedCultureIdRef.current || !mapInstance || !window.kakao?.maps) {
      return;
    }

    setCenterPosition(currentLocation);
    mapInstance.panTo(new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng));
    if (mapInstance.getLevel() > 4) {
      mapInstance.setLevel(4);
    }
  }, [currentLocation, mapInstance]);

  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    const handleResize = () => {
      mapInstance.relayout();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapInstance]);

  useEffect(() => {
    if (!mapInstance || !window.kakao?.maps || !markerClustererRef.current) {
      return;
    }

    const useCluster = selectedCultureId === null;

    markerClustererRef.current.clear();
    markerRefs.current.forEach(marker => marker.setMap(null));
    markerRefs.current = [];

    const kakaoMaps = window.kakao.maps;
    const selectionOverlays: kakao.maps.CustomOverlay[] = [];

    markerGroups.forEach((group, index) => {
      const focusedId = pendingDetailId ?? activeMarkerId;
      const isSelected = focusedId !== null && group.duplicateCultures.some(culture => culture.id === focusedId);
      const iconUrl = isSelected
        ? '/assets/images/map-marker-active-icon.svg'
        : '/assets/images/map-marker-default-icon.svg';
      const markerPixelSize = isSelected ? EMPHASIZED_MARKER_PIXEL_SIZE : DEFAULT_MARKER_PIXEL_SIZE;
      const iconSize = new kakaoMaps.Size(markerPixelSize, markerPixelSize);

      const marker = new kakaoMaps.Marker({
        map: useCluster ? null : mapInstance,
        title: group.primaryCulture.title,
        position: new kakaoMaps.LatLng(group.lat, group.lng),
        image: new kakaoMaps.MarkerImage(iconUrl, iconSize),
        zIndex: isSelected ? markerGroups.length + 1 : markerGroups.length - index,
        clickable: true,
      });

      kakaoMaps.event.addListener(marker, 'click', () => {
        handleMarkerGroupClick(group);
      });

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
      markerClustererRef.current.addMarkers(markerRefs.current);
    }

    return () => {
      markerClustererRef.current?.clear();
      selectionOverlays.forEach(overlay => overlay.setMap(null));
      markerRefs.current.forEach(marker => marker.setMap(null));
      markerRefs.current = [];
    };
  }, [activeMarkerId, handleMarkerGroupClick, mapInstance, markerGroups, pendingDetailId, selectedCultureId]);

  useEffect(() => {
    if (!mapInstance || !window.kakao?.maps) {
      return;
    }

    currentLocationMarkerRef.current?.setMap(null);
    currentLocationMarkerRef.current = null;

    if (!currentLocation) {
      return;
    }

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

  const handleRetry = useCallback(() => {
    resetKakaoMapsSdk();
    setSdkError(null);
    setIsMapReady(false);
    setRetryNonce(value => value + 1);
  }, []);

  if (sdkError) {
    return (
      <MapStatus kind='map-error' code={sdkError.code} onRetry={handleRetry} onContinueWithList={onContinueWithList} />
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
