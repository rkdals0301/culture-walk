'use client';

import GoogleAdSlot from '@/components/Ads/GoogleAdSlot';
import CultureList from '@/components/Header/CultureList';
import CultureListLoading from '@/components/Header/CultureListLoading';
import { useCultureContext } from '@/context/CultureContext';
import { useCultures } from '@/hooks/cultureHooks';
import { FormattedCulture } from '@/types/culture';

import { useEffect, useMemo, useState } from 'react';

import { usePathname, useRouter } from 'next/navigation';

import ArrowBackIcon from '../../../public/assets/images/arrow-back-icon.svg';
import SearchCancelIcon from '../../../public/assets/images/search-cancel-icon.svg';
import SearchIcon from '../../../public/assets/images/search-icon.svg';

interface StatCardProps {
  label: string;
  value: number;
}

const StatCard = ({ label, value }: StatCardProps) => (
  <div className='min-w-0 px-3 py-2.5 text-center'>
    <p className='text-[0.65rem] font-semibold text-[var(--app-muted)]'>{label}</p>
    <p className='mt-0.5 truncate text-base font-semibold'>{value}</p>
  </div>
);

const ADSENSE_MAP_PANEL_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MAP_PANEL;
const DESKTOP_PANEL_WIDTH = 400;
const DESKTOP_RAIL_WIDTH = 72;

const MapDashboard = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { cultures, filteredCultures, searchQuery, setSearchQuery } = useCultureContext();
  const { isLoading, error } = useCultures();
  const [isDesktopPanelCollapsed, setIsDesktopPanelCollapsed] = useState(false);
  const [isMobileSheetVisible, setIsMobileSheetVisible] = useState(false);
  const isDetailRoute = /^\/map\/\d+/.test(pathname ?? '');
  const selectedCultureId = useMemo(() => {
    const match = (pathname ?? '').match(/^\/map\/(\d+)/);
    if (!match) {
      return null;
    }

    const parsed = Number.parseInt(match[1], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }, [pathname]);

  const totalCount = cultures.length;
  const visibleCultures = searchQuery.trim() ? filteredCultures : cultures;
  const districtCount = useMemo(() => new Set(cultures.map(culture => culture.guName).filter(Boolean)).size, [cultures]);
  const freeCount = useMemo(
    () =>
      cultures.filter(culture => {
        const value = `${culture.isFree} ${culture.displayPrice}`.toLowerCase();
        return value.includes('free') || value.includes('무료');
      }).length,
    [cultures]
  );

  const handleOpenCulture = (culture: FormattedCulture) => {
    router.push(`/map/${culture.id}`);
  };

  useEffect(() => {
    if (!isDetailRoute) {
      return;
    }

    setIsMobileSheetVisible(false);
  }, [isDetailRoute]);

  useEffect(() => {
    const panelWidth = isDetailRoute || !isDesktopPanelCollapsed ? DESKTOP_PANEL_WIDTH : DESKTOP_RAIL_WIDTH;
    document.documentElement.style.setProperty('--map-sidebar-width', `${panelWidth}px`);

    const notifyMapResize = () => window.dispatchEvent(new Event('resize'));
    const animationFrame = window.requestAnimationFrame(notifyMapResize);
    const transitionTimer = window.setTimeout(notifyMapResize, 300);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(transitionTimer);
    };
  }, [isDesktopPanelCollapsed, isDetailRoute]);

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
            onClick={() => setSearchQuery('')}
            className='mt-4 rounded-xl bg-[#1f765f] px-4 py-2 text-sm font-semibold text-[#fff8f1] transition hover:bg-[#175846]'
          >
            검색 초기화
          </button>
        </div>
      );
    }

    return (
      <CultureList cultures={visibleCultures} onItemClick={handleOpenCulture} selectedCultureId={selectedCultureId} />
    );
  };

  return (
    <div className='pointer-events-none absolute inset-0'>
      <aside
        className='pointer-events-auto absolute bottom-0 left-0 top-[72px] z-20 hidden overflow-hidden border-r border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text)] backdrop-blur-2xl transition-[width] duration-300 lg:flex'
        style={{ width: 'var(--map-sidebar-width)' }}
        aria-label='문화행사 탐색 패널'
      >
        {isDesktopPanelCollapsed && !isDetailRoute ? (
          <div className='flex h-full w-[72px] flex-col items-center border-r border-[var(--app-border)] px-2 py-4'>
            <button
              type='button'
              onClick={() => setIsDesktopPanelCollapsed(false)}
              className='soft-chip flex size-10 items-center justify-center rounded-xl text-[var(--app-text)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
              aria-label='행사 목록 패널 펼치기'
              title='행사 목록 펼치기'
            >
              <ArrowBackIcon className='size-4 rotate-180' />
            </button>

            <div className='mt-6 grid w-full gap-3 text-center'>
              <div>
                <p className='text-[0.62rem] font-semibold text-[var(--app-muted)]'>행사</p>
                <p className='mt-0.5 text-sm font-semibold'>{totalCount}</p>
              </div>
              <div className='border-y border-[var(--app-border)] py-3'>
                <p className='text-[0.62rem] font-semibold text-[var(--app-muted)]'>무료</p>
                <p className='mt-0.5 text-sm font-semibold'>{freeCount}</p>
              </div>
              <div>
                <p className='text-[0.62rem] font-semibold text-[var(--app-muted)]'>지역</p>
                <p className='mt-0.5 text-sm font-semibold'>{districtCount}</p>
              </div>
            </div>
          </div>
        ) : (
          <section className='flex h-full w-[400px] min-w-[400px] flex-col overflow-hidden'>
            <div className='shrink-0 border-b border-[var(--app-border)] px-5 pb-4 pt-5'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='text-[0.7rem] font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>서울 문화행사</p>
                  <h2 className='mt-1 text-xl font-semibold leading-[1.2]'>행사 찾기</h2>
                </div>
                {!isDetailRoute && (
                  <button
                    type='button'
                    onClick={() => setIsDesktopPanelCollapsed(true)}
                    className='soft-chip flex size-9 shrink-0 items-center justify-center rounded-xl text-[var(--app-muted)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                    aria-label='행사 목록 패널 접기'
                    title='행사 목록 접기'
                  >
                    <ArrowBackIcon className='size-4' />
                  </button>
                )}
              </div>

              <form
                role='search'
                className='mt-4 flex h-11 items-center gap-2 rounded-[14px] border border-[var(--app-border)] bg-[var(--app-card)] px-3'
                onSubmit={event => event.preventDefault()}
              >
                <SearchIcon className='size-[18px] shrink-0 text-[#1f765f]' />
                <input
                  type='search'
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder='행사명으로 검색'
                  aria-label='문화행사 검색'
                  className='min-w-0 flex-1 bg-transparent text-sm font-medium placeholder:text-[var(--app-muted)]'
                />
                {searchQuery && (
                  <button
                    type='button'
                    onClick={() => setSearchQuery('')}
                    className='flex size-8 shrink-0 items-center justify-center rounded-lg text-[var(--app-muted)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
                    aria-label='검색어 초기화'
                  >
                    <SearchCancelIcon className='size-4' />
                  </button>
                )}
              </form>

              <div className='mt-3 grid grid-cols-3 divide-x divide-[var(--app-border)] rounded-[14px] border border-[var(--app-border)] bg-[var(--app-chip)]'>
                <StatCard label='전체' value={totalCount} />
                <StatCard label='무료' value={freeCount} />
                <StatCard label='지역' value={districtCount} />
              </div>

              <div className='mt-3 flex items-center justify-between text-xs text-[var(--app-muted)]'>
                <span>{searchQuery.trim() ? '검색 결과' : '진행 중인 행사'}</span>
                <strong className='font-semibold text-[var(--app-text)]'>{visibleCultures.length}개</strong>
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

      <div className='pointer-events-none flex h-full w-full flex-col px-4 pb-4 pt-[5.4rem] sm:px-6 sm:pb-6 sm:pt-[6rem] lg:hidden'>
        {!isDetailRoute && isMobileSheetVisible ? (
          <section className='surface-panel pointer-events-auto mt-auto flex h-[72vh] min-h-[390px] max-h-[82dvh] w-full flex-col overflow-hidden rounded-[24px] text-[var(--app-text)]'>
            <div className='border-b border-[var(--app-border)] px-4 py-3'>
              <div className='mb-2 flex items-center justify-center'>
                <div className='h-1.5 w-12 rounded-full bg-[#1f765f]/20' />
              </div>
              <div className='flex items-center justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='text-[0.7rem] font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>행사 목록</p>
                  <p className='mt-1 truncate text-sm font-medium text-[var(--app-muted)]'>
                    총 {totalCount}개 · 무료 {freeCount}개 · {districtCount}개 구
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setIsMobileSheetVisible(false)}
                  className='shrink-0 rounded-full bg-[#1f765f] px-3.5 py-2 text-xs font-semibold text-[#fff8f1] shadow-[0_14px_30px_-22px_rgba(31,118,95,0.9)]'
                >
                  지도만 보기
                </button>
              </div>
            </div>
            <div className='min-h-0 flex-1 px-2 pb-2 pt-2'>{renderListPanel()}</div>
          </section>
        ) : !isDetailRoute ? (
          <div className='pointer-events-auto mt-auto flex justify-center'>
            <button
              type='button'
              onClick={() => setIsMobileSheetVisible(true)}
              className='surface-panel rounded-full border-[#1f765f]/20 px-5 py-3 text-sm font-semibold text-[var(--app-text)] shadow-[0_20px_44px_-30px_rgba(16,33,29,0.6)]'
            >
              목록 보기 {totalCount > 0 ? `· ${totalCount}개` : ''}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MapDashboard;
