import { useCultureContext } from '@/context/CultureContext';
import { useExploreLocationControls } from '@/hooks/useExploreLocationControls';
import type { FormattedCultureListItem } from '@/types/culture';
import { CULTURE_CATEGORY_OPTIONS, type CultureCategoryKey } from '@/utils/cultureCategory';
import { getEffectiveMapSortMode } from '@/utils/exploreState';
import { getMapCamera, getMapListScrollTop, setMapCamera, setMapListScrollTop } from '@/utils/exploreNavigationMemory';
import { calculateDistanceMeters } from '@/utils/geo';
import { createMapExploreUrl, getMapDetailId } from '@/utils/mapRoute';

import { useEffect, useMemo, useState, useTransition } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import { useMapExploreUrlSync } from './useMapExploreUrlSync';
import { useMapPanelLayout } from './useMapPanelLayout';

interface UseMapDashboardControllerOptions {
  listRequest: number;
  viewportCultures: FormattedCultureListItem[];
}

export const useMapDashboardController = ({
  listRequest,
  viewportCultures,
}: UseMapDashboardControllerOptions) => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    searchQuery,
    mapCategory,
    mapRegion,
    mapFreeOnly,
    mapSortMode,
    setSearchQuery,
    setMapCategory,
    setMapRegion,
    setMapFreeOnly,
    resetMapFilters,
    currentLocation,
    setMapSortMode,
  } = useCultureContext();
  const { changeSortMode: handleSortChange, isLocating, toggleLocation: handleLocationToggle } = useExploreLocationControls();
  const [isDesktopPanelCollapsed, setIsDesktopPanelCollapsed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('list') === 'open') {
      setIsDesktopPanelCollapsed(false);
    }
  }, []);
  const [isMobileSheetVisible, setIsMobileSheetVisible] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [focusCultureId, setFocusCultureId] = useState<number | null>(null);
  const [restoredSelectedCultureId, setRestoredSelectedCultureId] = useState<number | null>(null);
  const [isFilterPending, startFilterTransition] = useTransition();
  const routeCultureId = getMapDetailId(pathname);
  const isDetailRoute = routeCultureId !== null;
  const selectedCultureId = routeCultureId ?? restoredSelectedCultureId;

  const visibleCultures = useMemo(() => {
    if (mapSortMode !== 'distance' || !currentLocation) {
      return viewportCultures;
    }

    return [...viewportCultures].sort(
      (left, right) =>
        calculateDistanceMeters(currentLocation, { lat: left.lat, lng: left.lng }) -
        calculateDistanceMeters(currentLocation, { lat: right.lat, lng: right.lng })
    );
  }, [currentLocation, mapSortMode, viewportCultures]);

  const hasActiveFilters = Boolean(searchQuery.trim()) || mapCategory !== 'all' || mapRegion !== 'all' || mapFreeOnly;
  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    const normalizedSearchQuery = searchQuery.trim();
    const categoryLabel = CULTURE_CATEGORY_OPTIONS.find(option => option.key === mapCategory)?.label;

    if (normalizedSearchQuery) labels.push(`“${normalizedSearchQuery}”`);
    if (categoryLabel && mapCategory !== 'all') labels.push(categoryLabel);
    if (mapRegion !== 'all') labels.push(mapRegion);
    if (mapFreeOnly) labels.push('무료');
    return labels;
  }, [mapCategory, mapFreeOnly, mapRegion, searchQuery]);

  const filterMotionKey = useMapExploreUrlSync({
    currentLocation,
    focusCultureId,
    isMobileSheetVisible,
    mapCategory,
    mapFreeOnly,
    mapRegion,
    mapSortMode,
    restoredSelectedCultureId,
    searchQuery,
    setFocusCultureId,
    setIsMobileSheetVisible,
    setMapCategory,
    setMapFreeOnly,
    setMapRegion,
    setMapSortMode,
    setRestoredSelectedCultureId,
    setSearchQuery,
  });

  useMapPanelLayout(isDesktopPanelCollapsed, isDetailRoute);

  useEffect(() => {
    const handleOpenMapSearch = () => {
      setIsMobileSheetVisible(true);
      window.setTimeout(() => {
        const input = (document.getElementById('map-search-input-mobile') ||
          document.getElementById('map-search-input')) as HTMLInputElement | null;
        input?.focus();
        input?.select();
      }, 150);
    };

    window.addEventListener('cw:open-map-search', handleOpenMapSearch);
    return () => window.removeEventListener('cw:open-map-search', handleOpenMapSearch);
  }, []);

  const handleCategoryChange = (nextCategory: CultureCategoryKey) => {
    startFilterTransition(() => setMapCategory(nextCategory));
  };

  const handleFreeOnlyChange = (nextFreeOnly: boolean) => {
    startFilterTransition(() => setMapFreeOnly(nextFreeOnly));
  };

  const handleRegionChange = (nextRegion: string) => {
    startFilterTransition(() => setMapRegion(nextRegion));
  };

  const handleOpenCulture = (culture: FormattedCultureListItem) => {
    const detailUrl = createMapExploreUrl(`/map/${culture.id}`, {
      searchQuery,
      mapCategory,
      mapRegion,
      mapFreeOnly,
      sortMode: getEffectiveMapSortMode(mapSortMode, Boolean(currentLocation)),
      mapListScrollTop: getMapListScrollTop(),
      listOpen: false,
      mapCamera: getMapCamera(),
    });

    if (isDetailRoute) {
      router.replace(detailUrl);
      return;
    }
    router.push(detailUrl);
  };

  useEffect(() => {
    if (isDetailRoute || pathname !== '/map' || focusCultureId === null) return;

    setIsMobileSheetVisible(true);
    let attempts = 0;
    let focusFrame = 0;
    const focusSelectedRow = () => {
      const selectedRow = document.querySelector<HTMLElement>(`[data-culture-id="${focusCultureId}"]`);
      if (selectedRow) {
        selectedRow.focus();
        setFocusCultureId(null);
        return;
      }

      if (attempts >= 120) {
        setFocusCultureId(null);
        return;
      }

      attempts += 1;
      focusFrame = window.requestAnimationFrame(focusSelectedRow);
    };

    focusFrame = window.requestAnimationFrame(focusSelectedRow);
    return () => window.cancelAnimationFrame(focusFrame);
  }, [focusCultureId, isDetailRoute, pathname, visibleCultures.length]);

  useEffect(() => {
    if (isDetailRoute) setIsMobileSheetVisible(false);
  }, [isDetailRoute]);

  useEffect(() => {
    if (!isMobileSheetVisible || isDetailRoute) setIsMobileFiltersOpen(false);
  }, [isDetailRoute, isMobileSheetVisible]);

  useEffect(() => {
    if (listRequest === 0) return;
    setIsMobileSheetVisible(true);
    document.getElementById('culture-list')?.focus();
  }, [listRequest]);

  return {
    activeFilterLabels,
    currentLocation,
    filterMotionKey,
    handleCategoryChange,
    handleFreeOnlyChange,
    handleLocationToggle,
    handleOpenCulture,
    handleRegionChange,
    handleSortChange,
    hasActiveFilters,
    isDesktopPanelCollapsed,
    isDetailRoute,
    isFilterPending,
    isLocating,
    isMobileFiltersOpen,
    isMobileSheetVisible,
    mapCategory,
    mapFreeOnly,
    mapListScrollTop: getMapListScrollTop(),
    mapRegion,
    mapSortMode,
    resetMapFilters,
    searchQuery,
    selectedCultureId,
    setIsDesktopPanelCollapsed,
    setIsMobileFiltersOpen,
    setIsMobileSheetVisible,
    setMapListScrollTop,
    setSearchQuery,
    visibleCultures,
  };
};
