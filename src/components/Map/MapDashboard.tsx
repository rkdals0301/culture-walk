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
        <div className='flex h-full flex-col items-center justify-center p-6 text-center'>
          <p className='text-base font-semibold'>행사 데이터를 불러오지 못했습니다.</p>
          <p className='mt-2 text-sm text-[var(--app-muted)]'>{error.message}</p>
        </div>
      );
    }

    if (visibleCultures.length === 0) {
      return (
        <div className='flex h-full flex-col items-center justify-center px-6 text-center'>
          <p className='text-base font-semibold'>검색 결과가 없습니다.</p>
          <p className='mt-2 text-sm leading-6 text-[var(--app-muted)]'>다른 행사명이나 분류를 입력해보세요.</p>
          <button
            type='button'
            onClick={resetMapFilters}
            className='mt-4 inline-flex min-h-11 items-center rounded-xl bg-[var(--app-primary)] px-4 text-sm font-semibold text-[var(--app-on-primary)] transition hover:bg-[var(--app-primary-hover)]'
          >
            필터 초기화
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
      className='pointer-events-none absolute inset-0 scroll-mt-24 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-focus)]'
    >
      {!isDetailRoute && <h1 className='sr-only'>전국 문화행사 지도</h1>}
      <aside
        data-keeps-detail-open
        className={clsx(
          'pointer-events-auto absolute bottom-0 left-0 top-[72px] z-20 hidden overflow-hidden text-[var(--app-text)] transition-[width] duration-[280ms]',
          isDetailRoute ? 'min-[1280px]:flex' : 'lg:flex',
          isDesktopPanelCollapsed
            ? 'border-r-0'
            : 'border-r border-[var(--app-border)] bg-[var(--app-surface)] backdrop-blur-2xl'
        )}
        style={{ width: 'var(--map-sidebar-width)' }}
        aria-label='문화행사 탐색 패널'
      >
        {!isDesktopPanelCollapsed && (
          <section className='flex h-full w-[400px] min-w-[400px] flex-col overflow-hidden'>
            <div className='shrink-0 border-b border-[var(--app-border)] px-5 pb-3.5 pt-4'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='text-[0.7rem] font-semibold text-[var(--app-primary)]'>전국 문화행사</p>
                  <h2 className='mt-1 text-xl font-semibold leading-[1.2]'>행사 찾기</h2>
                </div>
                <button
                  type='button'
                  onClick={() => setIsDesktopPanelCollapsed(true)}
                  className='soft-chip flex size-11 shrink-0 items-center justify-center rounded-xl text-[var(--app-muted)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                  aria-label='행사 목록 패널 접기'
                  title='행사 목록 접기'
                >
                  <ArrowBackIcon className='size-4' />
                </button>
              </div>

              <form
                role='search'
                className='mt-3.5 flex h-11 items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3'
                onSubmit={event => event.preventDefault()}
              >
                <SearchIcon className='size-[18px] shrink-0 text-[var(--app-primary)]' />
                <input
                  type='text'
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder='행사명으로 검색'
                  aria-label='문화행사 검색'
                  autoComplete='off'
                  spellCheck={false}
                  enterKeyHint='search'
                  className='min-w-0 flex-1 bg-transparent text-sm font-medium placeholder:text-[var(--app-muted)]'
                />
                {searchQuery && (
                  <button
                    type='button'
                    onClick={() => setSearchQuery('')}
                    className='flex size-11 shrink-0 items-center justify-center rounded-lg text-[var(--app-muted)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                    aria-label='검색어 초기화'
                  >
                    <SearchCancelIcon className='size-4' />
                  </button>
                )}
              </form>

              <div className='mt-2.5'>
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

              <div className='mt-2.5 flex items-center justify-between gap-3 text-xs text-[var(--app-muted)]'>
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
                <strong className='font-semibold text-[var(--app-text)]'>
                  {visibleCultures.length}개<span className='font-medium text-[var(--app-muted)]'> / {totalCount}</span>
                </strong>
              </div>

              {ADSENSE_MAP_PANEL_SLOT && (
                <div className='mt-3 border-t border-[var(--app-border)] pt-3'>
                  <GoogleAdSlot slot={ADSENSE_MAP_PANEL_SLOT} className='min-h-[88px]' />
                </div>
              )}
            </div>
            <div className='min-h-0 flex-1 px-2 pb-2 pt-2'>{renderListPanel()}</div>
          </section>
        )}
      </aside>

      {isDesktopPanelCollapsed && !isDetailRoute && (
        <button
          type='button'
          onClick={() => setIsDesktopPanelCollapsed(false)}
          className='pointer-events-auto absolute left-0 top-1/2 z-20 hidden h-14 w-8 -translate-y-1/2 items-center justify-center rounded-r-lg border border-l-0 border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] shadow-[var(--app-shadow-soft)] backdrop-blur-md transition hover:w-9 hover:bg-[var(--app-card)] lg:flex'
          aria-label='행사 목록 패널 펼치기'
          title='행사 목록 펼치기'
        >
          <ArrowBackIcon className='size-4 rotate-180' />
          {hasActiveFilters && <span className='absolute right-1 top-1.5 size-1.5 rounded-full bg-[var(--app-accent)]' />}
        </button>
      )}

      <div className='pointer-events-none flex h-full w-full flex-col px-4 pb-4 pt-[5.4rem] sm:px-6 sm:pb-6 sm:pt-[6rem] lg:hidden'>
        {!isDetailRoute && isMobileSheetVisible ? (
          <section className='surface-panel pointer-events-auto mt-auto flex h-[72vh] max-h-[82dvh] min-h-[390px] w-full flex-col overflow-hidden rounded-[20px] text-[var(--app-text)]'>
            <div className='border-b border-[var(--app-border)] px-4 py-3'>
              <div className='mb-2 flex items-center justify-center'>
                <div className='h-1.5 w-12 rounded-full bg-[var(--app-primary)]/20' />
              </div>
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='text-[0.7rem] font-semibold text-[var(--app-primary)]'>행사 목록</p>
                  <p className='mt-1 truncate text-sm font-medium text-[var(--app-muted)]'>
                    총 {visibleCultures.length}개
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setIsMobileSheetVisible(false)}
                  className='inline-flex min-h-11 shrink-0 items-center rounded-xl bg-[var(--app-primary)] px-3.5 text-xs font-semibold text-[var(--app-on-primary)] shadow-[0_10px_22px_-18px_rgba(31,118,95,0.64)]'
                >
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
                <strong className='text-xs font-semibold text-[var(--app-text)]'>{visibleCultures.length}개</strong>
              </div>
            </div>
            <div className='min-h-0 flex-1 px-2 pb-2 pt-2'>{renderListPanel()}</div>
          </section>
        ) : !isDetailRoute ? (
          <div className='pointer-events-auto mt-auto flex justify-center'>
            <button
              type='button'
              onClick={() => setIsMobileSheetVisible(true)}
              className='surface-panel inline-flex min-h-11 items-center rounded-xl border-[var(--app-primary)]/20 px-5 py-3 text-sm font-semibold text-[var(--app-text)] shadow-[0_14px_30px_-24px_rgba(16,33,29,0.38)]'
            >
              목록 보기 {visibleCultures.length > 0 ? `· ${visibleCultures.length}개` : ''}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MapDashboard;
