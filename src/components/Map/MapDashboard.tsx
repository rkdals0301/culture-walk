'use client';

import MapDesktopDashboard from '@/components/Map/MapDesktopDashboard';
import MapMobileDashboard from '@/components/Map/MapMobileDashboard';
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
    handleRegionChange,
    handleSortChange,
    hasActiveFilters,
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
          activeFilterLabels={activeFilterLabels}
          currentLocation={currentLocation}
          error={error}
          filterMotionKey={filterMotionKey}
          handleCategoryChange={handleCategoryChange}
          handleFreeOnlyChange={handleFreeOnlyChange}
          handleLocationToggle={handleLocationToggle}
          handleOpenCulture={handleOpenCulture}
          handleRegionChange={handleRegionChange}
          handleSortChange={handleSortChange}
          hasActiveFilters={hasActiveFilters}
          isClustered={isClustered}
          isDesktopPanelCollapsed={isDesktopPanelCollapsed}
          isFilterPending={isFilterPending}
          isLoading={isLoading}
          isLocating={isLocating}
          mapCategory={mapCategory}
          mapFreeOnly={mapFreeOnly}
          mapListScrollTop={mapListScrollTop}
          mapRegion={mapRegion}
          mapSortMode={mapSortMode}
          onRetry={onRetry}
          regionOptions={regionOptions}
          resetMapFilters={resetMapFilters}
          searchQuery={searchQuery}
          selectedCultureId={selectedCultureId}
          setIsDesktopPanelCollapsed={setIsDesktopPanelCollapsed}
          setMapListScrollTop={setMapListScrollTop}
          setSearchQuery={setSearchQuery}
          totalCount={totalCount}
          viewportCount={viewportCount}
          visibleCultures={visibleCultures}
        />
      )}
      {!isDetailRoute && (
        <MapMobileDashboard
          activeFilterLabels={activeFilterLabels}
          currentLocation={currentLocation}
          error={error}
          filterMotionKey={filterMotionKey}
          handleCategoryChange={handleCategoryChange}
          handleFreeOnlyChange={handleFreeOnlyChange}
          handleLocationToggle={handleLocationToggle}
          handleOpenCulture={handleOpenCulture}
          handleRegionChange={handleRegionChange}
          handleSortChange={handleSortChange}
          hasActiveFilters={hasActiveFilters}
          isClustered={isClustered}
          isFilterPending={isFilterPending}
          isLoading={isLoading}
          isLocating={isLocating}
          isMobileFiltersOpen={isMobileFiltersOpen}
          isMobileSheetVisible={isMobileSheetVisible}
          mapCategory={mapCategory}
          mapFreeOnly={mapFreeOnly}
          mapListScrollTop={mapListScrollTop}
          mapRegion={mapRegion}
          mapSortMode={mapSortMode}
          onRetry={onRetry}
          regionOptions={regionOptions}
          resetMapFilters={resetMapFilters}
          searchQuery={searchQuery}
          selectedCultureId={selectedCultureId}
          setIsMobileFiltersOpen={setIsMobileFiltersOpen}
          setIsMobileSheetVisible={setIsMobileSheetVisible}
          setMapListScrollTop={setMapListScrollTop}
          setSearchQuery={setSearchQuery}
          totalCount={totalCount}
          viewportCount={viewportCount}
          visibleCultures={visibleCultures}
        />
      )}
    </div>
  );
};

export default MapDashboard;
