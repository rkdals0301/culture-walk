import { useCultureContext } from '@/context/CultureContext';
import type { FormattedCulture } from '@/types/culture';
import { CULTURE_CATEGORY_OPTIONS, type CultureCategoryKey } from '@/utils/cultureCategory';
import {
  type MapSortMode,
  getEffectiveMapSortMode,
  serializeMapExploreStateToSearch,
} from '@/utils/exploreState';
import { LocationRequestError, calculateDistanceMeters, getGeolocationErrorMessage } from '@/utils/geo';
import { getMapDetailId } from '@/utils/mapRoute';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'react-toastify';

import { usePathname, useRouter } from 'next/navigation';

import { useMapExploreUrlSync } from './useMapExploreUrlSync';
import { useMapPanelLayout } from './useMapPanelLayout';

interface UseMapDashboardControllerOptions {
  listRequest: number;
  viewportCultures: FormattedCulture[];
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
    mapCamera,
    locationStatus,
    mapListScrollTop,
    setSearchQuery,
    setMapCategory,
    setMapRegion,
    setMapFreeOnly,
    resetMapFilters,
    currentLocation,
    setCurrentLocation,
    setMapSortMode,
    setMapCamera,
    requestLocation: requestLocationFromProvider,
    cancelLocation,
    setMapListScrollTop,
  } = useCultureContext();
  const [isDesktopPanelCollapsed, setIsDesktopPanelCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true;
    const params = new URLSearchParams(window.location.search);
    return params.get('list') !== 'open';
  });
  const [isMobileSheetVisible, setIsMobileSheetVisible] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [focusCultureId, setFocusCultureId] = useState<number | null>(null);
  const [restoredSelectedCultureId, setRestoredSelectedCultureId] = useState<number | null>(null);
  const [isFilterPending, startFilterTransition] = useTransition();
  const routeCultureId = getMapDetailId(pathname);
  const isDetailRoute = routeCultureId !== null;
  const selectedCultureId = routeCultureId ?? restoredSelectedCultureId;
  const isLocating = locationStatus === 'requesting';

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

  const requestLocation = async () => {
    try {
      return await requestLocationFromProvider();
    } catch (locationError) {
      if (locationError instanceof LocationRequestError && locationError.status === 'cancelled') {
        toast.info(getGeolocationErrorMessage(locationError));
      } else {
        toast.error(getGeolocationErrorMessage(locationError));
      }
      return null;
    }
  };

  const handleSortChange = async (nextMode: MapSortMode) => {
    if (nextMode === 'date') {
      setMapSortMode('date');
      return;
    }

    const location = await requestLocation();
    if (location) setMapSortMode('distance');
  };

  const handleLocationToggle = async () => {
    if (locationStatus === 'requesting') {
      cancelLocation();
      return;
    }

    if (currentLocation) {
      setCurrentLocation(null);
      if (mapSortMode === 'distance') setMapSortMode('date');
      return;
    }

    await requestLocation();
  };

  const handleOpenCulture = (culture: FormattedCulture) => {
    const serializedSearch = serializeMapExploreStateToSearch({
      searchQuery,
      mapCategory,
      mapRegion,
      mapFreeOnly,
      sortMode: getEffectiveMapSortMode(mapSortMode, Boolean(currentLocation)),
      mapListScrollTop,
      listOpen: false,
      mapCamera,
    });
    const detailPath = `/map/${culture.id}`;
    const detailUrl = serializedSearch ? `${detailPath}?${serializedSearch}` : detailPath;

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
    mapListScrollTop,
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
