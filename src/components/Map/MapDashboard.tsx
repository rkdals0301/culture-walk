'use client';

import GoogleAdSlot from '@/components/Ads/GoogleAdSlot';
import CultureList from '@/components/Header/CultureList';
import CultureListLoading from '@/components/Header/CultureListLoading';
import { MapFilterControls, MapLocationControl, MapSortControl, MapSortMode } from '@/components/Map/MapControls';
import { useCultureContext } from '@/context/CultureContext';
import { useCultures } from '@/hooks/cultureHooks';
import { FormattedCulture } from '@/types/culture';
import { calculateDistanceMeters, getGeolocationErrorMessage, requestCurrentLocation } from '@/utils/geo';
import { getMapDetailId, shouldRestoreMapList } from '@/utils/mapRoute';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { usePathname, useRouter } from 'next/navigation';

import clsx from 'clsx';
import { List, MapPinned } from 'lucide-react';

import ArrowBackIcon from '../../../public/assets/images/arrow-back-icon.svg';
import SearchCancelIcon from '../../../public/assets/images/search-cancel-icon.svg';
import SearchIcon from '../../../public/assets/images/search-icon.svg';

const ADSENSE_MAP_PANEL_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MAP_PANEL;
const DESKTOP_PANEL_WIDTH = 400;

const MapDashboard = () => {
  const router = useRouter();
  const pathname = usePathname();
  const {
    cultures,
    mapCultures,
    searchQuery,
    mapCategory,
    mapRegion,
    mapFreeOnly,
    setSearchQuery,
    setMapCategory,
    setMapRegion,
    setMapFreeOnly,
    resetMapFilters,
    currentLocation,
    setCurrentLocation,
    loadCultures,
  } = useCultureContext();
  const { isLoading, error } = useCultures();
  const [isDesktopPanelCollapsed, setIsDesktopPanelCollapsed] = useState(false);
  const [isWideDesktop, setIsWideDesktop] = useState(false);
  const [isMobileSheetVisible, setIsMobileSheetVisible] = useState(false);
  const [sortMode, setSortMode] = useState<MapSortMode>('date');
  const [isLocating, setIsLocating] = useState(false);
  const selectedCultureId = getMapDetailId(pathname);
  const isDetailRoute = selectedCultureId !== null;

  const totalCount = cultures.length;
  const regionOptions = useMemo(
    () =>
      Array.from(new Set(cultures.map(culture => culture.guName.split(/\s+/)[0]).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'ko')
      ),
    [cultures]
  );
  const visibleCultures = useMemo(() => {
    if (sortMode !== 'distance' || !currentLocation) {
      return mapCultures;
    }

    return [...mapCultures].sort(
      (left, right) =>
        calculateDistanceMeters(currentLocation, { lat: left.lat, lng: left.lng }) -
        calculateDistanceMeters(currentLocation, { lat: right.lat, lng: right.lng })
    );
  }, [currentLocation, mapCultures, sortMode]);
  const hasActiveFilters = Boolean(searchQuery.trim()) || mapCategory !== 'all' || mapRegion !== 'all' || mapFreeOnly;

  const requestLocation = async () => {
    if (currentLocation) {
      return currentLocation;
    }

    if (isLocating) {
      return null;
    }

    setIsLocating(true);
    try {
      const location = await requestCurrentLocation();
      setCurrentLocation(location);
      return location;
    } catch (locationError) {
      toast.error(getGeolocationErrorMessage(locationError));
      return null;
    } finally {
      setIsLocating(false);
    }
  };

  const handleSortChange = async (nextMode: MapSortMode) => {
    if (nextMode === 'date') {
      setSortMode('date');
      return;
    }

    const location = await requestLocation();
    if (location) {
      setSortMode('distance');
    }
  };

  const handleLocationToggle = async () => {
    if (currentLocation) {
      setCurrentLocation(null);
      if (sortMode === 'distance') {
        setSortMode('date');
      }
      return;
    }

    await requestLocation();
  };

  const handleOpenCulture = (culture: FormattedCulture) => {
    const detailPath = `/map/${culture.id}`;
    if (isDetailRoute) {
      router.replace(detailPath);
      return;
    }

    router.push(detailPath);
  };

  useEffect(() => {
    if (!isDetailRoute) {
      return;
    }

    setIsMobileSheetVisible(false);
  }, [isDetailRoute]);

  useEffect(() => {
    if (isDetailRoute || typeof window === 'undefined') {
      return;
    }

    if (!shouldRestoreMapList(window.location.search)) {
      return;
    }

    setIsMobileSheetVisible(true);
    router.replace('/map', { scroll: false });
  }, [isDetailRoute, router]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const updateViewport = () => setIsWideDesktop(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    const isDetailOverlay = isDetailRoute && !isWideDesktop;
    const listPanelWidth = isDesktopPanelCollapsed || isDetailOverlay ? 0 : DESKTOP_PANEL_WIDTH;
    const detailPanelWidth = isDetailRoute && isWideDesktop ? DESKTOP_PANEL_WIDTH : 0;
    document.documentElement.style.setProperty('--map-sidebar-width', `${listPanelWidth}px`);
    document.documentElement.style.setProperty('--map-detail-width', `${detailPanelWidth}px`);

    const notifyMapResize = () => window.dispatchEvent(new Event('resize'));
    const animationFrame = window.requestAnimationFrame(notifyMapResize);
    const transitionTimer = window.setTimeout(notifyMapResize, 280);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(transitionTimer);
    };
  }, [isDesktopPanelCollapsed, isDetailRoute, isWideDesktop]);

  const renderListPanel = () => {
    if (isLoading) {
      return <CultureListLoading />;
    }

    if (error) {
      return (
        <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
          <p className='text-base font-semibold'>행사 데이터를 불러오지 못했습니다.</p>
          <p className='mt-2 max-w-xs text-sm leading-6 text-[var(--color-text-secondary)]'>
            잠시 후 다시 시도하거나 페이지를 새로고침해 주세요.
          </p>
          <button
            type='button'
            onClick={() => void loadCultures({ force: true })}
            className='mt-4 inline-flex min-h-11 items-center rounded-lg bg-[var(--color-brand-primary)] px-4 text-sm font-semibold text-[var(--color-brand-on-primary)] transition hover:bg-[var(--color-brand-hover)]'
          >
            다시 불러오기
          </button>
        </div>
      );
    }

    if (visibleCultures.length === 0) {
      return (
        <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
          <p className='text-base font-semibold'>
            {hasActiveFilters ? '조건에 맞는 행사가 없습니다.' : '표시할 행사가 없습니다.'}
          </p>
          <p className='mt-2 max-w-xs text-sm leading-6 text-[var(--color-text-secondary)]'>
            {hasActiveFilters ? '검색어를 지우거나 지역·분류 조건을 넓혀보세요.' : '잠시 후 다시 확인해 주세요.'}
          </p>
          <button
            type='button'
            onClick={resetMapFilters}
            className='mt-4 inline-flex min-h-11 items-center rounded-lg bg-[var(--color-brand-primary)] px-4 text-sm font-semibold text-[var(--color-brand-on-primary)] transition hover:bg-[var(--color-brand-hover)]'
          >
            {hasActiveFilters ? '조건 초기화' : '필터 초기화'}
          </button>
        </div>
      );
    }

    return (
      <CultureList
        cultures={visibleCultures}
        onItemClick={handleOpenCulture}
        selectedCultureId={selectedCultureId}
        currentLocation={currentLocation}
      />
    );
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
      <aside
        data-keeps-detail-open
        className={clsx(
          'pointer-events-auto absolute bottom-0 left-0 top-[72px] z-20 hidden overflow-hidden text-[var(--color-text-primary)] transition-[width] duration-[280ms]',
          isDetailRoute ? 'min-[1280px]:flex' : 'lg:flex',
          isDesktopPanelCollapsed ? 'border-r-0' : 'border-r border-[var(--color-border-primary)] bg-[var(--color-surface-primary)]'
        )}
        style={{ width: 'var(--map-sidebar-width)' }}
        aria-label='문화행사 탐색 패널'
      >
        {!isDesktopPanelCollapsed && (
          <section className='flex h-full w-[400px] min-w-[400px] flex-col overflow-hidden'>
            <div className='shrink-0 border-b border-[var(--color-border-primary)] px-5 pb-4 pt-5'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='route-kicker'>전국 문화행사</p>
                  <h2 className='mt-2 text-2xl font-semibold leading-[1.15] tracking-[-0.04em]'>행사 찾기</h2>
                  <p className='mt-2 text-xs leading-5 text-[var(--color-text-secondary)]'>
                    조건을 고르면 지도와 목록이 함께 좁혀집니다.
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setIsDesktopPanelCollapsed(true)}
                  className='soft-chip flex size-11 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-interactive-active)]'
                  aria-label='행사 목록 패널 접기'
                  title='행사 목록 접기'
                >
                  <ArrowBackIcon className='size-4' />
                </button>
              </div>

              <form
                role='search'
                className='mt-4 flex h-11 items-center gap-2 rounded-lg border border-[var(--color-input-border)] bg-[var(--color-input-bg)] px-3 transition-colors focus-within:border-[var(--color-input-focus)]'
                onSubmit={event => event.preventDefault()}
              >
                <SearchIcon className='size-[18px] shrink-0 text-[var(--color-brand-primary)]' />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder='행사명으로 검색'
                  aria-label='문화행사 검색'
                  autoComplete='off'
                  spellCheck={false}
                  enterKeyHint='search'
                  className='min-w-0 flex-1 bg-transparent text-sm font-medium placeholder:text-[var(--color-text-secondary)]'
                />
                {searchQuery && (
                  <button
                    type='button'
                    onClick={() => setSearchQuery('')}
                    className='flex size-11 shrink-0 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-interactive-hover)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-interactive-active)]'
                    aria-label='검색어 초기화'
                  >
                    <SearchCancelIcon className='size-4' />
                  </button>
                )}
              </form>

              <div className='mt-3 border-t border-[var(--color-border-primary)] pt-3'>
                <MapFilterControls
                  category={mapCategory}
                  freeOnly={mapFreeOnly}
                  region={mapRegion}
                  regionOptions={regionOptions}
                  onCategoryChange={setMapCategory}
                  onFreeOnlyChange={setMapFreeOnly}
                  onRegionChange={setMapRegion}
                />
              </div>

              <div className='mt-3 flex items-center justify-between gap-3 border-t border-[var(--color-border-primary)] pt-3 text-xs text-[var(--color-text-secondary)]'>
                <div className='flex min-w-0 items-center gap-2'>
                  <MapSortControl
                    mode={sortMode}
                    hasLocation={Boolean(currentLocation)}
                    isLocating={isLocating}
                    onChange={handleSortChange}
                  />
                  <MapLocationControl
                    isActive={Boolean(currentLocation)}
                    isLocating={isLocating}
                    onToggle={handleLocationToggle}
                  />
                </div>
                <strong className='font-semibold text-[var(--color-text-primary)]' aria-live='polite' aria-atomic='true'>
                  {visibleCultures.length}개<span className='font-medium text-[var(--color-text-secondary)]'> / {totalCount}</span>
                </strong>
              </div>

              {ADSENSE_MAP_PANEL_SLOT && (
                <div className='mt-3 border-t border-[var(--color-border-primary)] pt-3'>
                  <GoogleAdSlot slot={ADSENSE_MAP_PANEL_SLOT} className='min-h-[88px]' />
                </div>
              )}
            </div>
            <div className='min-h-0 flex-1 px-1 pb-1 pt-1'>{renderListPanel()}</div>
          </section>
        )}
      </aside>

      {isDesktopPanelCollapsed && !isDetailRoute && (
        <button
          type='button'
          onClick={() => setIsDesktopPanelCollapsed(false)}
          className='pointer-events-auto absolute left-0 top-1/2 z-20 hidden h-14 w-8 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] shadow-[var(--color-shadow-soft)] transition hover:w-9 hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-interactive-active)] lg:flex'
          aria-label='행사 목록 패널 펼치기'
          title='행사 목록 펼치기'
        >
          <ArrowBackIcon className='size-4 rotate-180' />
          {hasActiveFilters && (
            <span className='absolute right-1 top-1.5 size-1.5 rounded-full bg-[var(--color-accent-primary)]' />
          )}
        </button>
      )}

      <div className='pointer-events-none flex h-full w-full flex-col px-4 pb-4 pt-[5.4rem] sm:px-6 sm:pb-6 sm:pt-[6rem] lg:hidden'>
        {!isDetailRoute && isMobileSheetVisible ? (
          <section className='surface-panel pointer-events-auto mt-auto flex h-[72vh] max-h-[82dvh] min-h-[390px] w-full flex-col overflow-hidden rounded-[18px] text-[var(--color-text-primary)]'>
            <div className='border-b border-[var(--color-border-primary)] px-4 py-3'>
              <div className='mb-2 flex items-center justify-center'>
                <div className='bg-[var(--color-brand-subtle)] h-1.5 w-12 rounded-full' />
              </div>
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='route-kicker'>행사 목록</p>
                  <p className='mt-2 truncate text-sm font-medium text-[var(--color-text-secondary)]'>
                    총 {visibleCultures.length}개 · 지도와 동기화됨
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setIsMobileSheetVisible(false)}
                  className='inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-brand-primary)] px-3.5 text-xs font-semibold text-[var(--color-brand-on-primary)] shadow-[var(--color-shadow-brand)] transition hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)]'
                >
                  <MapPinned aria-hidden='true' className='size-3.5' strokeWidth={1.8} />
                  지도만 보기
                </button>
              </div>
              <div className='mt-3'>
                <MapFilterControls
                  category={mapCategory}
                  freeOnly={mapFreeOnly}
                  region={mapRegion}
                  regionOptions={regionOptions}
                  onCategoryChange={setMapCategory}
                  onFreeOnlyChange={setMapFreeOnly}
                  onRegionChange={setMapRegion}
                />
              </div>
              <div className='mt-2.5 flex items-center justify-between gap-3'>
                <div className='flex min-w-0 items-center gap-2'>
                  <MapSortControl
                    mode={sortMode}
                    hasLocation={Boolean(currentLocation)}
                    isLocating={isLocating}
                    onChange={handleSortChange}
                  />
                  <MapLocationControl
                    isActive={Boolean(currentLocation)}
                    isLocating={isLocating}
                    onToggle={handleLocationToggle}
                  />
                </div>
                <strong className='text-xs font-semibold text-[var(--color-text-primary)]' aria-live='polite' aria-atomic='true'>
                  {visibleCultures.length}개
                </strong>
              </div>
            </div>
            <div className='min-h-0 flex-1 px-1 pb-1 pt-1'>{renderListPanel()}</div>
          </section>
        ) : !isDetailRoute ? (
          <div className='pointer-events-auto mt-auto flex justify-center'>
            <button
              type='button'
              onClick={() => setIsMobileSheetVisible(true)}
              className='surface-panel border-[var(--color-border-brand)] inline-flex min-h-11 items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-[var(--color-text-primary)] shadow-[var(--color-shadow-soft)] transition hover:bg-[var(--color-interactive-hover)] active:bg-[var(--color-interactive-active)]'
            >
              <List aria-hidden='true' className='size-4 text-[var(--color-brand-primary)]' strokeWidth={1.8} />
              행사 {visibleCultures.length > 0 ? `${visibleCultures.length}개` : ''} 보기
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MapDashboard;
