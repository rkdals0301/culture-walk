'use client';

import GoogleAdSlot from '@/components/Ads/GoogleAdSlot';
import {
  CategoryChips,
  FreeOnlyToggle,
  LocationToggle,
  RegionSelect,
  ResetFiltersButton,
} from '@/components/Common/FilterControls';
import { MapFilterControls, MapSortControl } from '@/components/Map/MapControls';
import MapListPanelContent from '@/components/Map/MapListPanelContent';
import MapResultSummary from '@/components/Map/MapResultSummary';
import MapSearchField from '@/components/Map/MapSearchField';
import { useMapDashboardController } from '@/hooks/useMapDashboardController';
import { FormattedCulture } from '@/types/culture';

import clsx from 'clsx';
import { ChevronUp, List, ListFilter, MapPinned, X } from 'lucide-react';

const ADSENSE_MAP_PANEL_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MAP_PANEL;

interface MapDashboardProps {
  listRequest?: number;
  visibleCultures: FormattedCulture[];
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

      {/* ========================================================================= */}
      {/* DESKTOP (md:): Option A - Modern Full-Screen Map with Floating Controls  */}
      {/* ========================================================================= */}

      {/* 1. Floating Slide-over List Panel (Expanded State) */}
      {!isDetailRoute && !isDesktopPanelCollapsed && (
        <aside
          data-keeps-detail-open
          className='pointer-events-auto absolute bottom-4 left-4 top-[calc(var(--map-header-height)+1rem)] z-30 hidden w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] shadow-2xl transition-all duration-300 md:flex'
          aria-label='문화행사 탐색 패널'
        >
          {/* Header section with Search & Filters */}
          <div className='shrink-0 border-b border-[var(--color-border-primary)] p-4'>
            <div className='flex items-center justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <h2 className='text-base font-bold tracking-tight text-[var(--color-text-primary)]'>행사 목록</h2>
                <span className='rounded-full bg-[var(--color-surface-chip)] px-2.5 py-0.5 text-xs font-bold text-[var(--color-brand-primary)]'>
                  {viewportCount.toLocaleString()}개
                </span>
              </div>
              <button
                type='button'
                onClick={() => setIsDesktopPanelCollapsed(true)}
                className='soft-chip flex size-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-text-primary)] active:scale-95'
                aria-label='목록 접고 전체 지도 보기'
                title='목록 접고 전체 지도 보기'
              >
                <X className='size-4' />
              </button>
            </div>

            <div className='mt-3'>
              <MapSearchField id='map-search-input' value={searchQuery} onChange={setSearchQuery} />
            </div>

            <div className='mt-2.5'>
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

            <div className='mt-2.5 flex items-center justify-between gap-2 border-t border-[var(--color-border-primary)] pt-2.5 text-xs'>
              <div className='flex items-center gap-1.5'>
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
            </div>

            {ADSENSE_MAP_PANEL_SLOT && (
              <div className='mt-2.5 border-t border-[var(--color-border-primary)] pt-2.5'>
                <GoogleAdSlot slot={ADSENSE_MAP_PANEL_SLOT} className='min-h-[60px]' />
              </div>
            )}
          </div>

          {/* Scrollable Virtualized Event List */}
          <div className='min-h-0 flex-1 px-1 py-1'>
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
                hasActiveFilters={hasActiveFilters}
                initialScrollTop={mapListScrollTop}
                isClustered={isClustered}
                isLoading={isLoading}
                onItemClick={handleOpenCulture}
                onResetFilters={resetMapFilters}
                onRetry={onRetry}
                onScrollPositionChange={setMapListScrollTop}
                selectedCultureId={selectedCultureId}
              />
            </div>
          </div>
        </aside>
      )}

      {/* 2. Compact Floating Search & Filter Pill Card (Collapsed State) */}
      {!isDetailRoute && isDesktopPanelCollapsed && (
        <aside
          data-keeps-detail-open
          className='pointer-events-auto absolute left-4 top-[calc(var(--map-header-height)+1rem)] z-30 hidden w-[420px] max-w-[calc(100vw-2rem)] flex-col gap-2.5 rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] p-3.5 shadow-xl transition-all duration-200 md:flex'
          aria-label='문화행사 빠른 검색'
        >
          {/* Top Search bar + List expand trigger */}
          <div className='flex items-center gap-2'>
            <div className='min-w-0 flex-1'>
              <MapSearchField id='map-search-input-collapsed' value={searchQuery} onChange={setSearchQuery} compact />
            </div>
            <button
              type='button'
              onClick={() => setIsDesktopPanelCollapsed(false)}
              className='inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-brand-primary)] px-3 text-xs font-bold text-[var(--color-brand-on-primary)] shadow-sm transition hover:opacity-95 active:scale-95'
              aria-label='행사 목록 펼치기'
              title='행사 목록 펼치기'
            >
              <List className='size-4' />
              <span>목록</span>
              <span className='rounded-full bg-white/20 px-1.5 py-0.5 text-[0.68rem] font-bold'>
                {viewportCount.toLocaleString()}
              </span>
            </button>
          </div>

          {/* Category Chips - unified rounded-full pill styling */}
          <CategoryChips
            selected={mapCategory}
            onSelect={handleCategoryChange}
            layout='grid'
            size='sm'
          />

          {/* Quick controls row: Sort, Region, Free toggle, Location, Reset */}
          <div className='flex flex-wrap items-center justify-between gap-1.5 border-t border-[var(--color-border-primary)] pt-2 text-xs'>
            <div className='flex items-center gap-1.5'>
              <RegionSelect
                region={mapRegion}
                regionOptions={regionOptions}
                onChange={handleRegionChange}
                size='sm'
              />
              <FreeOnlyToggle
                isFreeOnly={mapFreeOnly}
                onToggle={() => handleFreeOnlyChange(!mapFreeOnly)}
                size='sm'
              />
              <LocationToggle
                isActive={Boolean(currentLocation)}
                isLocating={isLocating}
                onToggle={handleLocationToggle}
                size='sm'
                compact
              />
            </div>
            <div className='flex items-center gap-1.5'>
              <MapSortControl
                mode={mapSortMode}
                hasLocation={Boolean(currentLocation)}
                isLocating={isLocating}
                onChange={handleSortChange}
                size='sm'
              />
              {hasActiveFilters && (
                <ResetFiltersButton
                  onReset={resetMapFilters}
                  size='sm'
                />
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ========================================================================= */}
      {/* MOBILE (< md): Native Mobile Bottom Sheet Experience                     */}
      {/* ========================================================================= */}
      <div className='pointer-events-none flex h-full w-full flex-col pt-[5.4rem] sm:pt-[6rem] md:hidden'>
        {!isDetailRoute && isMobileSheetVisible ? (
          <section
            className='surface-panel pointer-events-auto mt-auto flex h-[calc(100dvh-6.4rem)] max-h-none min-h-[400px] w-full flex-col overflow-hidden rounded-b-none rounded-t-[28px] border-x-0 border-b-0 border-t border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] pb-[env(safe-area-inset-bottom,0px)] text-[var(--color-text-primary)] shadow-2xl backdrop-blur-xl'
            aria-busy={isFilterPending || isLoading}
          >
            {/* Mobile swipe/grab handle indicator */}
            <div
              className='flex w-full shrink-0 cursor-grab items-center justify-center pb-1 pt-2.5 active:cursor-grabbing'
              onClick={() => setIsMobileSheetVisible(false)}
              role='button'
              tabIndex={0}
              aria-label='행사 목록 접고 지도 보기'
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  setIsMobileSheetVisible(false);
                }
              }}
            >
              <div className='h-1.5 w-10 rounded-full bg-[var(--color-text-tertiary)]/35 transition-colors hover:bg-[var(--color-text-tertiary)]/60' />
            </div>
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
                  <MapPinned
                    aria-hidden='true'
                    className='size-4 text-[var(--color-brand-primary)]'
                    strokeWidth={2.2}
                  />
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
                    'flex h-9 shrink-0 items-center gap-1 rounded-xl border px-2.5 text-xs font-bold transition-all duration-150',
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
                  hasActiveFilters={hasActiveFilters}
                  initialScrollTop={mapListScrollTop}
                  isClustered={isClustered}
                  isLoading={isLoading}
                  onItemClick={handleOpenCulture}
                  onResetFilters={resetMapFilters}
                  onRetry={onRetry}
                  onScrollPositionChange={setMapListScrollTop}
                  selectedCultureId={selectedCultureId}
                />
              </div>
            </div>
          </section>
        ) : !isDetailRoute ? (
          <div className='pointer-events-auto mt-auto flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]'>
            <button
              type='button'
              onClick={() => setIsMobileSheetVisible(true)}
              className='group inline-flex min-h-12 items-center gap-3 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-elevated)] px-4 py-2 text-left text-sm font-semibold text-[var(--color-text-primary)] shadow-lg transition-all duration-150 active:scale-[0.98]'
              aria-label={
                isClustered
                  ? '행사 밀집 지역을 확대해서 행사 목록 보기'
                  : `행사 목록 열기, 현재 영역 ${viewportCount}개 행사`
              }
            >
              <span className='shadow-xs flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-primary)] text-white'>
                <List aria-hidden='true' className='size-4' strokeWidth={2} />
              </span>
              <span className='flex min-w-0 flex-col'>
                <span className='text-[0.68rem] font-bold text-[var(--color-brand-primary)]'>
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
        ) : null}
      </div>
    </div>
  );
};

export default MapDashboard;
