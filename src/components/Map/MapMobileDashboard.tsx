import { LocationToggle } from '@/components/Common/FilterControls';
import { MapFilterControls, MapSortControl } from '@/components/Map/MapControls';
import MapListPanelContent from '@/components/Map/MapListPanelContent';
import MapResultSummary from '@/components/Map/MapResultSummary';
import MapSearchField from '@/components/Map/MapSearchField';
import type { MapDashboardViewModel } from '@/components/Map/mapDashboardModel';

import clsx from 'clsx';
import { ChevronUp, List, ListFilter, MapPinned } from 'lucide-react';

interface MapMobileDashboardProps {
  isMobileFiltersOpen: boolean;
  isMobileSheetVisible: boolean;
  model: MapDashboardViewModel;
  setIsMobileFiltersOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  setIsMobileSheetVisible: (visible: boolean) => void;
}

const MapMobileDashboard = ({
  isMobileFiltersOpen,
  isMobileSheetVisible,
  model,
  setIsMobileFiltersOpen,
  setIsMobileSheetVisible,
}: MapMobileDashboardProps) => {
  const {
    actions: {
      onCategoryChange: handleCategoryChange,
      onFocusCultureHandled,
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
  } = model;

  return (
  <div className='pointer-events-none flex h-full w-full flex-col pt-[5.4rem] sm:pt-[6rem] md:hidden'>
    {isMobileSheetVisible ? (
      <section
        className='surface-panel pointer-events-auto mt-auto flex h-[calc(100dvh-6.4rem)] max-h-none min-h-[400px] w-full flex-col overflow-hidden rounded-b-none rounded-t-[28px] border-x-0 border-b-0 border-t border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] pb-[env(safe-area-inset-bottom,0px)] text-[var(--color-text-primary)] shadow-2xl backdrop-blur-xl'
        aria-busy={isFilterPending || isLoading}
      >
        <button
          type='button'
          className='flex w-full shrink-0 cursor-grab items-center justify-center pb-1 pt-2.5 active:cursor-grabbing'
          onClick={() => setIsMobileSheetVisible(false)}
          aria-label='행사 목록 접고 지도 보기'
        >
          <div className='h-1.5 w-10 rounded-full bg-[var(--color-text-tertiary)]/35 transition-colors hover:bg-[var(--color-text-tertiary)]/60' />
        </button>

        <div className='border-b border-[var(--color-border-primary)] px-4 pb-2.5 pt-1'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <h3 className='text-base font-bold text-[var(--color-text-primary)]'>행사 목록</h3>
              <span className='rounded-full bg-[var(--color-surface-chip)] px-2 py-0.5 text-[0.72rem] font-bold text-[var(--color-brand-primary)]'>
                {viewportCount.toLocaleString()}개
              </span>
            </div>
            <button
              type='button'
              onClick={() => setIsMobileSheetVisible(false)}
              className='inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] px-3.5 text-xs font-bold text-[var(--color-text-primary)] shadow-2xs transition hover:bg-[var(--color-interactive-hover)] active:scale-[0.98]'
              aria-label='목록 접고 지도 보기'
            >
              <MapPinned aria-hidden='true' className='size-4 text-[var(--color-brand-primary)]' strokeWidth={2.2} />
              <span>지도 보기</span>
            </button>
          </div>

          <MapResultSummary
            visibleCount={viewportCount}
            totalCount={totalCount}
            isClustered={isClustered}
            activeFilterLabels={activeFilterLabels}
            hasActiveFilters={hasActiveFilters}
            isLoading={isLoading}
            onReset={resetMapFilters}
            compact
          />

          <div className='mt-2'>
            <MapSearchField id='map-search-input-mobile' value={searchQuery} onChange={setSearchQuery} compact />
          </div>

          <div className='mt-2 flex items-center justify-between gap-1.5'>
            <button
              type='button'
              onClick={() => setIsMobileFiltersOpen(current => !current)}
              aria-expanded={isMobileFiltersOpen}
              aria-controls='map-mobile-filters'
              className={clsx(
                'flex min-h-11 shrink-0 items-center gap-1 rounded-xl border px-2.5 text-xs font-bold transition-all duration-150',
                isMobileFiltersOpen || hasActiveFilters
                  ? 'border-[var(--color-border-brand)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-hover)]'
                  : 'border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]'
              )}
            >
              <ListFilter aria-hidden='true' className='size-3.5' strokeWidth={2} />
              <span>필터</span>
              {activeFilterLabels.length > 0 && (
                <span className='flex size-4.5 min-w-[18px] items-center justify-center rounded-full bg-[var(--color-brand-primary)] px-1 text-[0.65rem] font-bold text-[var(--color-brand-on-primary)]'>
                  {activeFilterLabels.length}
                </span>
              )}
              <ChevronUp
                aria-hidden='true'
                className={clsx('size-3.5 transition-transform duration-150', !isMobileFiltersOpen && 'rotate-180')}
                strokeWidth={2.2}
              />
            </button>

            <div className='flex shrink-0 items-center gap-1.5'>
              <MapSortControl
                mode={mapSortMode}
                hasLocation={Boolean(currentLocation)}
                isLocating={isLocating}
                onChange={handleSortChange}
              />
              <LocationToggle
                isActive={Boolean(currentLocation)}
                isLocating={isLocating}
                onToggle={handleLocationToggle}
                compact
                size='sm'
              />
            </div>
          </div>

          {isMobileFiltersOpen && (
            <div
              id='map-mobile-filters'
              className='mt-2.5 rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] p-2.5'
            >
              <MapFilterControls
                category={mapCategory}
                freeOnly={mapFreeOnly}
                region={mapRegion}
                regionOptions={regionOptions}
                onCategoryChange={handleCategoryChange}
                onFreeOnlyChange={handleFreeOnlyChange}
                onRegionChange={handleRegionChange}
              />
            </div>
          )}
        </div>

        <div className='min-h-0 flex-1 px-1 pb-1 pt-1'>
          <div
            key={filterMotionKey}
            className='map-filter-results h-full min-h-0'
            data-filter-pending={isFilterPending ? 'true' : undefined}
            aria-busy={isFilterPending}
          >
            <MapListPanelContent
              cultures={visibleCultures}
              currentLocation={currentLocation}
              error={error}
              focusCultureId={focusCultureId}
              hasActiveFilters={hasActiveFilters}
              initialScrollTop={mapListScrollTop}
              isClustered={isClustered}
              isLoading={isLoading}
              onItemClick={handleOpenCulture}
              onFocusCultureHandled={onFocusCultureHandled}
              onResetFilters={resetMapFilters}
              onRetry={onRetry}
              onScrollPositionChange={setMapListScrollTop}
              selectedCultureId={selectedCultureId}
            />
          </div>
        </div>
      </section>
    ) : (
      <div className='pointer-events-auto mt-auto flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]'>
        <button
          type='button'
          onClick={() => setIsMobileSheetVisible(true)}
          className='group inline-flex min-h-12 items-center gap-3 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] px-4 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] shadow-lg transition-all duration-150 active:scale-[0.98]'
        >
          <span className='shadow-xs flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-white'>
            <List aria-hidden='true' className='size-4' strokeWidth={2} />
          </span>
          <span className='flex min-w-0 flex-col'>
            <span className='text-[0.68rem] font-bold text-[var(--color-brand-hover)]'>
              {hasActiveFilters ? '필터 적용됨' : '지도 행사'}
            </span>
            <span className='whitespace-nowrap text-xs font-bold text-[var(--color-text-primary)] sm:text-sm'>
              {isClustered ? '지도를 확대하면 목록 보기' : `현재 영역 ${viewportCount.toLocaleString()}개 보기`}
            </span>
          </span>
          <span className='ml-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-chip)] text-[var(--color-text-primary)]'>
            <ChevronUp aria-hidden='true' className='size-4' strokeWidth={2.2} />
          </span>
        </button>
      </div>
    )}
    </div>
  );
};

export default MapMobileDashboard;
