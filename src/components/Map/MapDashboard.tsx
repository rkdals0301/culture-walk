'use client';

import MapDesktopDashboard from '@/components/Map/MapDesktopDashboard';
import MapMobileDashboard from '@/components/Map/MapMobileDashboard';
import type { MapDashboardViewModel } from '@/components/Map/mapDashboardModel';
import { useMapDashboardController } from '@/hooks/useMapDashboardController';
import { FormattedCultureListItem } from '@/types/culture';

interface MapDashboardProps {
  listRequest?: number;
  visibleCultures: FormattedCultureListItem[];
  isClustered: boolean;
  totalCount: number;
  viewportCount: number;
  regionOptions: string[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
}

const MapDashboard = ({
  listRequest = 0,
  visibleCultures: viewportCultures,
  isClustered,
  totalCount,
  viewportCount,
  regionOptions,
  isLoading,
  error,
  onRetry,
}: MapDashboardProps) => {
  const {
    activeFilterLabels,
    currentLocation,
    filterMotionKey,
    handleCategoryChange,
    handleFreeOnlyChange,
    handleLocationToggle,
    handleOpenCulture,
    handleFocusCultureHandled,
    handleRegionChange,
    handleSortChange,
    hasActiveFilters,
    focusCultureId,
    isDesktopPanelCollapsed,
    isDetailRoute,
    isFilterPending,
    isLocating,
    isMobileFiltersOpen,
    isMobileSheetVisible,
    searchQuery,
    mapCategory,
    mapRegion,
    mapFreeOnly,
    mapSortMode,
    mapListScrollTop,
    setSearchQuery,
    resetMapFilters,
    setMapListScrollTop,
    selectedCultureId,
    setIsDesktopPanelCollapsed,
    setIsMobileFiltersOpen,
    setIsMobileSheetVisible,
    visibleCultures,
  } = useMapDashboardController({ listRequest, viewportCultures });

  const model: MapDashboardViewModel = {
    filters: {
      activeFilterLabels,
      category: mapCategory,
      currentLocation,
      filterMotionKey,
      freeOnly: mapFreeOnly,
      hasActiveFilters,
      isFilterPending,
      isLocating,
      region: mapRegion,
      regionOptions,
      searchQuery,
      sortMode: mapSortMode,
    },
    list: {
      cultures: visibleCultures,
      error,
      focusCultureId,
      isClustered,
      isLoading,
      scrollTop: mapListScrollTop,
      selectedCultureId,
      totalCount,
      viewportCount,
    },
    actions: {
      onCategoryChange: handleCategoryChange,
      onFocusCultureHandled: handleFocusCultureHandled,
      onFreeOnlyChange: handleFreeOnlyChange,
      onLocationToggle: handleLocationToggle,
      onOpenCulture: handleOpenCulture,
      onRegionChange: handleRegionChange,
      onResetFilters: resetMapFilters,
      onRetry,
      onScrollPositionChange: setMapListScrollTop,
      onSearchChange: setSearchQuery,
      onSortChange: handleSortChange,
    },
  };

  return (
    <div
      id='culture-list'
      role='region'
      aria-label='문화행사 목록'
      tabIndex={-1}
      className='pointer-events-none absolute inset-0 scroll-mt-24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]'
    >
      {!isDetailRoute && <h1 className='sr-only'>전국 문화행사 지도</h1>}

      {!isDetailRoute && (
        <MapDesktopDashboard
          model={model}
          isDesktopPanelCollapsed={isDesktopPanelCollapsed}
          setIsDesktopPanelCollapsed={setIsDesktopPanelCollapsed}
        />
      )}
      {!isDetailRoute && (
        <MapMobileDashboard
          model={model}
          isMobileFiltersOpen={isMobileFiltersOpen}
          isMobileSheetVisible={isMobileSheetVisible}
          setIsMobileFiltersOpen={setIsMobileFiltersOpen}
          setIsMobileSheetVisible={setIsMobileSheetVisible}
        />
      )}
    </div>
  );
};

export default MapDashboard;
