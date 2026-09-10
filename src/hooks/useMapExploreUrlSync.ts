import type { CultureCategoryKey } from '@/utils/cultureCategory';
import {
  type MapCameraState,
  type MapSortMode,
  getEffectiveMapSortMode,
  getMapFilterSignature,
  parseMapExploreStateFromSearch,
  serializeMapExploreStateToSearch,
} from '@/utils/exploreState';

import { useEffect, useRef } from 'react';

import { usePathname, useRouter } from 'next/navigation';

interface UseMapExploreUrlSyncOptions {
  currentLocation: { lat: number; lng: number } | null;
  focusCultureId: number | null;
  isMobileSheetVisible: boolean;
  mapCategory: CultureCategoryKey;
  mapCamera: MapCameraState | null;
  mapFreeOnly: boolean;
  mapListScrollTop: number;
  mapRegion: string;
  mapSortMode: MapSortMode;
  restoredSelectedCultureId: number | null;
  searchQuery: string;
  setFocusCultureId: (id: number | null) => void;
  setIsMobileSheetVisible: (isVisible: boolean) => void;
  setMapCategory: (category: CultureCategoryKey) => void;
  setMapCamera: (camera: MapCameraState | null) => void;
  setMapFreeOnly: (freeOnly: boolean) => void;
  setMapListScrollTop: (scrollTop: number) => void;
  setMapRegion: (region: string) => void;
  setMapSortMode: (mode: MapSortMode) => void;
  setRestoredSelectedCultureId: (id: number | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useMapExploreUrlSync = ({
  currentLocation,
  focusCultureId,
  isMobileSheetVisible,
  mapCategory,
  mapCamera,
  mapFreeOnly,
  mapListScrollTop,
  mapRegion,
  mapSortMode,
  restoredSelectedCultureId,
  searchQuery,
  setFocusCultureId,
  setIsMobileSheetVisible,
  setMapCategory,
  setMapCamera,
  setMapFreeOnly,
  setMapListScrollTop,
  setMapRegion,
  setMapSortMode,
  setRestoredSelectedCultureId,
  setSearchQuery,
}: UseMapExploreUrlSyncOptions) => {
  const pathname = usePathname();
  const router = useRouter();
  const routeRestorePendingRef = useRef(false);
  const previousFilterSignatureRef = useRef('');
  const mapCameraRef = useRef(mapCamera);
  const mapFilterSignature = getMapFilterSignature({
    searchQuery,
    mapCategory,
    mapRegion,
    mapFreeOnly,
    sortMode: mapSortMode,
  });

  useEffect(() => {
    mapCameraRef.current = mapCamera;
  }, [mapCamera]);

  useEffect(() => {
    if (pathname !== '/map' || typeof window === 'undefined') return;

    const restoredState = parseMapExploreStateFromSearch(window.location.search);
    routeRestorePendingRef.current = true;

    setSearchQuery(restoredState?.searchQuery ?? '');
    setMapCategory(restoredState?.mapCategory ?? 'all');
    setMapRegion(restoredState?.mapRegion ?? 'all');
    setMapFreeOnly(restoredState?.mapFreeOnly ?? false);
    setMapSortMode(restoredState?.sortMode ?? 'date');
    setMapListScrollTop(restoredState?.mapListScrollTop ?? 0);
    setIsMobileSheetVisible(restoredState?.listOpen ?? false);
    setMapCamera(restoredState?.mapCamera ?? null);
    setFocusCultureId(restoredState?.focusCultureId ?? null);
    setRestoredSelectedCultureId(restoredState?.selectedCultureId ?? null);
  }, [
    pathname,
    setFocusCultureId,
    setIsMobileSheetVisible,
    setMapCategory,
    setMapCamera,
    setMapFreeOnly,
    setMapListScrollTop,
    setMapRegion,
    setMapSortMode,
    setRestoredSelectedCultureId,
    setSearchQuery,
  ]);

  useEffect(() => {
    if (pathname !== '/map' || typeof window === 'undefined') return;

    if (routeRestorePendingRef.current) {
      routeRestorePendingRef.current = false;
      return;
    }

    const serializedSearch = serializeMapExploreStateToSearch({
      searchQuery,
      mapCategory,
      mapRegion,
      mapFreeOnly,
      sortMode: getEffectiveMapSortMode(mapSortMode, Boolean(currentLocation)),
      mapListScrollTop,
      listOpen: isMobileSheetVisible,
      mapCamera: mapCameraRef.current,
      focusCultureId,
      selectedCultureId: restoredSelectedCultureId,
    });
    const nextSearch = serializedSearch ? `?${serializedSearch}` : '';
    if (window.location.search !== nextSearch) {
      router.replace(`/map${nextSearch}`, { scroll: false });
    }
  }, [
    currentLocation,
    focusCultureId,
    isMobileSheetVisible,
    mapCategory,
    mapFreeOnly,
    mapListScrollTop,
    mapRegion,
    mapSortMode,
    pathname,
    restoredSelectedCultureId,
    router,
    searchQuery,
  ]);

  useEffect(() => {
    if (previousFilterSignatureRef.current === '') {
      previousFilterSignatureRef.current = mapFilterSignature;
      return;
    }

    if (previousFilterSignatureRef.current !== mapFilterSignature) {
      setMapListScrollTop(0);
      previousFilterSignatureRef.current = mapFilterSignature;
    }
  }, [mapFilterSignature, setMapListScrollTop]);

  return mapFilterSignature;
};
