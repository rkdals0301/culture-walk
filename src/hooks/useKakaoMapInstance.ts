import { KakaoMapsSdkError, loadKakaoMapsSdk, resetKakaoMapsSdk } from '@/utils/kakaoMapsSdk';
import { type MapCameraState, normalizeMapCameraState } from '@/utils/exploreState';

import { useCallback, useEffect, useRef, useState } from 'react';

const KAKAO_MAPS_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAPS_APP_KEY;
const DEFAULT_MAP_CENTER = { lat: 36.35, lng: 127.8 };
const DEFAULT_MAP_LEVEL = 13;
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

interface UseKakaoMapInstanceOptions {
  initialCamera?: MapCameraState | null;
}

export const useKakaoMapInstance = ({ initialCamera = null }: UseKakaoMapInstanceOptions = {}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerClustererRef = useRef<kakao.maps.MarkerClusterer | null>(null);
  const initialCameraRef = useRef(normalizeMapCameraState(initialCamera));
  const [mapInstance, setMapInstance] = useState<kakao.maps.Map | null>(null);
  const [sdkError, setSdkError] = useState<KakaoMapsSdkError | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

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
        const camera = initialCameraRef.current;
        const map = new kakaoMaps.Map(mapContainerRef.current, {
          center: new kakaoMaps.LatLng(camera?.lat ?? DEFAULT_MAP_CENTER.lat, camera?.lng ?? DEFAULT_MAP_CENTER.lng),
          level: camera?.level ?? DEFAULT_MAP_LEVEL,
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
      setMapInstance(null);
      setIsMapReady(false);
    };
  }, [retryNonce]);

  useEffect(() => {
    if (!mapInstance) return;

    const handleResize = () => mapInstance.relayout();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mapInstance]);

  const retry = useCallback(() => {
    resetKakaoMapsSdk();
    setSdkError(null);
    setIsMapReady(false);
    setRetryNonce(value => value + 1);
  }, []);

  return {
    mapContainerRef,
    markerClustererRef,
    mapInstance,
    sdkError,
    isMapReady,
    retry,
  };
};
