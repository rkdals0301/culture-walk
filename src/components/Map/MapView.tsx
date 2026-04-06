'use client';

import Loader from '@/components/Loader/Loader';
import MapFindMyLocationControl from '@/components/Map/MapFindMyLocationControl';
import MapZoomControls from '@/components/Map/MapZoomControls';
import { useBottomSheet } from '@/context/BottomSheetContext';
import { useCultureContext } from '@/context/CultureContext';
import { useCultures } from '@/hooks/cultureHooks';
import { FormattedCulture } from '@/types/culture';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

const KAKAO_MAPS_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY;
const KAKAO_MAPS_SCRIPT_ID = 'kakao-maps-sdk';
const DEFAULT_MAP_CENTER = { lat: 37.5665, lng: 126.978 };
const DEFAULT_MAP_LEVEL = 7;
const CLUSTER_STYLES: Array<Record<string, string>> = [
  {
    width: '40px',
    height: '40px',
    lineHeight: '40px',
    background: 'rgba(31, 118, 95, 0.88)',
    border: '2px solid rgba(247, 243, 234, 0.92)',
    borderRadius: '999px',
    color: '#f7f3ea',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: '12px',
    boxShadow: '0 10px 24px -14px rgba(31, 118, 95, 0.9)',
  },
  {
    width: '48px',
    height: '48px',
    lineHeight: '48px',
    background: 'rgba(31, 118, 95, 0.94)',
    border: '2px solid rgba(247, 243, 234, 0.92)',
    borderRadius: '999px',
    color: '#f7f3ea',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: '13px',
    boxShadow: '0 14px 30px -16px rgba(31, 118, 95, 0.95)',
  },
  {
    width: '56px',
    height: '56px',
    lineHeight: '56px',
    background: 'rgba(31, 118, 95, 0.98)',
    border: '2px solid rgba(247, 243, 234, 0.94)',
    borderRadius: '999px',
    color: '#f7f3ea',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: '14px',
    boxShadow: '0 18px 36px -18px rgba(31, 118, 95, 0.98)',
  },
];

interface MarkerGroup {
  duplicateCultures: FormattedCulture[];
  lat: number;
  lng: number;
  primaryCulture: FormattedCulture;
}

const MapUnavailableState = () => (
  <div className='flex size-full items-center justify-center p-4 sm:p-6'>
    <div className='surface-panel flex w-full max-w-2xl flex-col gap-4 rounded-[32px] p-6 text-[var(--app-text)] sm:p-8'>
      <p className='text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#1f765f] dark:text-[#8dc5b5]'>
        Map Preview Unavailable
      </p>
      <h2 className='text-3xl font-semibold tracking-[-0.05em] sm:text-4xl'>Kakao Maps 키가 설정되지 않았습니다.</h2>
      <p className='max-w-xl text-sm leading-6 text-[var(--app-muted)] sm:text-base'>
        `.env`에 `NEXT_PUBLIC_KAKAO_MAPS_APP_KEY`를 추가하면 지도가 활성화됩니다.
      </p>
      <div className='surface-card rounded-[24px] p-4'>
        <p className='text-sm font-semibold'>필수 환경 변수</p>
        <p className='mt-2 break-all text-sm text-[var(--app-muted)]'>NEXT_PUBLIC_KAKAO_MAPS_APP_KEY</p>
      </div>
    </div>
  </div>
);

const loadKakaoMapsSdk = async (appKey: string): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('window is not available.');
  }

  if (window.kakao?.maps) {
    return new Promise(resolve => {
      window.kakao?.maps.load(() => resolve());
    });
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(KAKAO_MAPS_SCRIPT_ID) as HTMLScriptElement | null;

    const onLoad = () => resolve();
    const onError = () => reject(new Error('Kakao Maps script failed to load.'));

    if (existingScript) {
      existingScript.addEventListener('load', onLoad, { once: true });
      existingScript.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = KAKAO_MAPS_SCRIPT_ID;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=clusterer`;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    document.head.appendChild(script);
  });

  if (!window.kakao?.maps) {
    throw new Error('Kakao Maps SDK is unavailable.');
  }

  await new Promise<void>(resolve => {
    window.kakao?.maps.load(() => resolve());
  });
};

const MapView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { openBottomSheet } = useBottomSheet();

  const { cultures } = useCultureContext();
  const { isLoading, error } = useCultures();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<kakao.maps.Marker[]>([]);
  const markerClustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const currentLocationMarkerRef = useRef<kakao.maps.Marker | null>(null);

  const [mapInstance, setMapInstance] = useState<kakao.maps.Map | null>(null);
  const [centerPosition, setCenterPosition] = useState(DEFAULT_MAP_CENTER);
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);
  const [pendingDetailId, setPendingDetailId] = useState<number | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const selectedCultureId = useMemo(() => {
    const match = pathname.match(/^\/map\/(\d+)/);
    if (!match) {
      return null;
    }

    const parsed = Number.parseInt(match[1], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [pathname]);

  const markerGroups = useMemo(() => {
    const groupMap = new Map<string, MarkerGroup>();

    cultures.forEach(culture => {
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
  }, [cultures]);

  const goToMapDetail = useCallback(
    (id: number) => {
      setPendingDetailId(id);
      setActiveMarkerId(id);
      router.push(`/map/${id}`);
    },
    [router]
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
              <p className='text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#1f765f] dark:text-[#8dc5b5]'>
                Shared Place
              </p>
              <h3 className='mt-2 text-xl font-semibold tracking-[-0.03em]'>같은 위치에서 여러 행사가 열리고 있습니다.</h3>
              <p className='mt-2 text-sm leading-6 text-[var(--app-muted)]'>
                아래 목록에서 원하는 행사를 선택하면 상세 화면으로 이동합니다.
              </p>
            </div>
            <ul className='grid gap-2'>
              {group.duplicateCultures.map(culture => (
                <li key={culture.id}>
                  <button
                    type='button'
                    onClick={() => goToMapDetail(culture.id)}
                    className='surface-card w-full rounded-[22px] p-4 text-left font-semibold tracking-[-0.02em] transition duration-200 hover:-translate-y-0.5 hover:border-[#1f765f]/20 hover:shadow-[0_24px_48px_-30px_rgba(31,118,95,0.45)]'
                  >
                    <p>{culture.title}</p>
                    <p className='mt-1 text-sm font-medium text-[var(--app-muted)]'>{culture.displayDate}</p>
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

  const handleLocationUpdate = useCallback(
    (lat: number, lng: number) => {
      setCurrentLocation({ lat, lng });
      setCenterPosition({ lat, lng });

      if (!mapInstance || !window.kakao?.maps) {
        return;
      }

      const nextCenter = new window.kakao.maps.LatLng(lat, lng);
      mapInstance.setCenter(nextCenter);

      const currentLevel = mapInstance.getLevel();
      if (currentLevel > 4) {
        mapInstance.setLevel(4);
      }
    },
    [mapInstance]
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
        mapInstance.setCenter(new window.kakao.maps.LatLng(selectedCulture.lat, selectedCulture.lng));
        if (mapInstance.getLevel() > 4) {
          mapInstance.setLevel(4);
        }
      }
    }
  }, [selectedCultureId, cultures, mapInstance]);

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
      setSdkError('NEXT_PUBLIC_KAKAO_MAPS_APP_KEY가 설정되지 않았습니다.');
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
      } catch {
        if (!canceled) {
          setSdkError('Kakao Maps 스크립트를 불러오지 못했습니다.');
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
  }, []);

  useEffect(() => {
    if (!mapInstance || !window.kakao?.maps) {
      return;
    }

    mapInstance.setCenter(new window.kakao.maps.LatLng(centerPosition.lat, centerPosition.lng));
  }, [centerPosition, mapInstance]);

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

    markerGroups.forEach((group, index) => {
      const focusedId = pendingDetailId ?? activeMarkerId;
      const isSelected = focusedId !== null && group.duplicateCultures.some(culture => culture.id === focusedId);
      const iconUrl = isSelected
        ? '/assets/images/map-marker-active-icon.svg'
        : '/assets/images/map-marker-default-icon.svg';
      const iconSize = isSelected ? new kakaoMaps.Size(40, 40) : new kakaoMaps.Size(32, 32);

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

      markerRefs.current.push(marker);
    });

    if (useCluster) {
      markerClustererRef.current.addMarkers(markerRefs.current);
    }

    return () => {
      markerClustererRef.current?.clear();
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
      image: new kakaoMaps.MarkerImage('/assets/images/map-marker-current-location-icon.svg', new kakaoMaps.Size(40, 40)),
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

  if (!KAKAO_MAPS_APP_KEY) {
    return <MapUnavailableState />;
  }

  if (sdkError) {
    return (
      <div className='flex size-full items-center justify-center p-4 sm:p-6'>
        <div className='surface-panel w-full max-w-xl rounded-[32px] p-6 text-[var(--app-text)] sm:p-8'>
          <p className='text-lg font-semibold tracking-[-0.03em]'>지도를 불러오지 못했습니다.</p>
          <p className='mt-2 text-sm leading-6 text-[var(--app-muted)]'>{sdkError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='relative size-full'>
      <div ref={mapContainerRef} className='size-full' style={{ pointerEvents: 'auto', touchAction: 'auto' }} />
      <div className='absolute right-3 top-[6.85rem] z-20 flex flex-col items-end gap-2 md:right-6 md:top-auto md:bottom-6'>
        <MapZoomControls map={mapInstance} />
        <MapFindMyLocationControl onLocationUpdate={handleLocationUpdate} />
      </div>

      {!isMapReady && (
        <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/10 backdrop-blur-[1px]'>
          <Loader />
        </div>
      )}

      {isMapReady && isLoading && (
        <div className='pointer-events-none absolute left-3 right-3 top-20 z-20 md:left-auto md:right-6 md:max-w-xs'>
          <div className='surface-panel rounded-[16px] px-3 py-2 text-xs font-medium text-[var(--app-muted)]'>
            행사 데이터를 불러오는 중입니다.
          </div>
        </div>
      )}

      {pendingDetailId !== null && (
        <div className='pointer-events-none absolute left-3 right-3 top-32 z-20 md:left-auto md:right-6 md:max-w-xs'>
          <div className='surface-panel rounded-[16px] px-3 py-2 text-xs font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>
            행사 상세를 여는 중입니다.
          </div>
        </div>
      )}

      {error && (
        <div className='absolute left-3 right-3 top-20 z-20 rounded-[20px] border border-rose-500/20 bg-rose-50/90 p-3 text-sm text-rose-800 backdrop-blur-md dark:bg-rose-900/30 dark:text-rose-100 md:left-6 md:right-auto md:max-w-sm'>
          행사 데이터를 불러오지 못했습니다: {error.message}
        </div>
      )}
    </div>
  );
};

export default React.memo(MapView);
