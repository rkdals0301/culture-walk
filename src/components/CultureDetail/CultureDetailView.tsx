'use client';

import CultureDetailGallery from '@/components/CultureDetail/CultureDetailGallery';
import CultureDetailFacts from '@/components/CultureDetail/CultureDetailFacts';
import ThemeToggleButton from '@/components/Theme/ThemeToggleButton';
import type { FormattedCultureDetail } from '@/types/culture';
import { getCultureDetailViewModel } from '@/utils/cultureDetailViewModel';
import { getCultureTimingStatus } from '@/utils/cultureTimingStatus';

import React, { useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  ChevronDown,
  Compass,
  ExternalLink,
  Navigation,
  Share2,
} from 'lucide-react';

interface CultureDetailViewProps {
  culture: FormattedCultureDetail;
}

const CultureDetailView = ({ culture }: CultureDetailViewProps) => {
  const router = useRouter();

  const detail = useMemo(() => getCultureDetailViewModel(culture), [culture]);
  const { imageList } = detail;

  const dday = useMemo(
    () => getCultureTimingStatus(culture.startDate, culture.endDate),
    [culture.startDate, culture.endDate]
  );
  const { hasOverview, hasProgram, visibleAdditionalInformation } = detail;

  const { fullAddress } = detail;

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${culture.title} | 문화산책`,
      text: `${culture.title} - ${culture.displayDate} (${culture.displayPlace})`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('공유에 실패했습니다.');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('행사 링크가 복사되었습니다.');
      } catch {
        toast.error('링크 복사에 실패했습니다.');
      }
    }
  }, [culture.displayDate, culture.displayPlace, culture.title]);

  const mapExploreUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('focus', String(culture.id));
    params.set('selected', String(culture.id));
    params.set('lat', String(culture.lat));
    params.set('lng', String(culture.lng));
    params.set('level', '4');
    params.set('list', 'open');
    return `/map?${params.toString()}`;
  }, [culture.id, culture.lat, culture.lng]);

  const kakaoNavUrl = useMemo(() => {
    return `https://map.kakao.com/link/to/${encodeURIComponent(culture.title)},${culture.lat},${culture.lng}`;
  }, [culture.lat, culture.lng, culture.title]);

  const naverNavUrl = useMemo(() => {
    return `https://map.naver.com/v5/search/${encodeURIComponent(fullAddress || culture.title)}`;
  }, [culture.title, fullAddress]);

  const primaryExternalUrl = culture.homepageDetailAddress || culture.homepageAddress;
  const primaryExternalLabel = culture.homepageDetailAddress ? '예약 / 상세 안내' : '공식 홈페이지 바로가기';

  return (
    <div
      id='culture-detail-scroll-container'
      className='relative h-full overflow-y-auto bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-colors selection:bg-[var(--color-brand-subtle)] selection:text-[var(--color-brand-primary)]'
    >
      {/* Keep the detail header quiet so the poster and event title carry the page. */}
      <header className='sticky top-0 z-40 border-b border-[var(--color-detail-divider)] bg-[var(--color-surface-primary)] transition-colors'>
        <div className='mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <button
            type='button'
            onClick={handleBack}
            aria-label='이전 페이지로 돌아가기'
            className='flex size-9 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
          >
            <ArrowLeft className='size-5' strokeWidth={1.8} />
          </button>

          <div className='flex min-w-0 flex-1 items-center justify-center px-4'>
            <span className='truncate text-[0.9375rem] font-semibold text-[var(--color-text-secondary)] sm:text-sm'>
              {culture.title}
            </span>
          </div>

          <div className='flex items-center gap-1'>
            <button
              type='button'
              onClick={handleShare}
              aria-label='행사 링크 공유하기'
              className='flex size-9 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
            >
              <Share2 className='size-4' strokeWidth={1.8} />
            </button>
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pb-32 sm:pt-10 lg:px-8 lg:pb-20'>
        <div className='lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-12 xl:gap-16'>
          {/* The poster is the visual anchor. Everything around it stays serviceable. */}
          <div className='lg:sticky lg:top-20'>
            <CultureDetailGallery culture={culture} imageList={imageList} />

            <div className='mt-5 hidden lg:flex lg:flex-col lg:gap-2'>
              {primaryExternalUrl && (
                <a
                  href={primaryExternalUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-[0.99]'
                >
                  <span>{primaryExternalLabel}</span>
                  <ExternalLink className='size-3.5' strokeWidth={1.8} />
                </a>
              )}
              <Link
                href={mapExploreUrl}
                className='flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--color-detail-divider)] bg-transparent px-4 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-chip)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-[0.99]'
              >
                <Compass className='size-3.5 text-[var(--color-brand-primary)]' strokeWidth={1.8} />
                <span>문화지도에서 위치 확인</span>
              </Link>
            </div>
          </div>

          <div className='mt-8 lg:mt-0'>
            <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-secondary)]'>
              <span className='font-semibold text-[var(--color-brand-primary)]'>
                {culture.classification || '문화행사'}
              </span>
              {culture.guName && (
                <>
                  <span aria-hidden='true' className='text-[var(--color-text-tertiary)]'>
                    /
                  </span>
                  <span>{culture.guName}</span>
                </>
              )}
              {dday && (
                <>
                  <span aria-hidden='true' className='text-[var(--color-text-tertiary)]'>
                    /
                  </span>
                  <span
                    className={
                      dday.variant === 'urgent'
                        ? 'font-semibold text-[var(--color-error)]'
                        : dday.variant === 'ended'
                          ? 'text-[var(--color-text-tertiary)]'
                          : 'font-medium text-[var(--color-text-secondary)]'
                    }
                  >
                    {dday.text}
                  </span>
                </>
              )}
            </div>

            <h1 className='mt-3 max-w-[18ch] text-3xl font-semibold leading-[1.12] tracking-[-0.04em] text-[var(--color-text-primary)] sm:text-4xl lg:text-[2.8rem]'>
              {culture.title}
            </h1>

            <CultureDetailFacts culture={culture} detail={detail} />

            {(hasOverview || hasProgram) && (
              <section className='mt-12 border-t border-[var(--color-detail-divider)] pt-7 sm:mt-14 sm:pt-8'>
                {hasOverview && (
                  <div>
                    <h2 className='text-base font-semibold tracking-tight text-[var(--color-text-primary)]'>
                      행사 소개
                    </h2>
                    <div className='mt-4 max-w-[68ch] text-[0.9375rem] leading-[1.85] text-[var(--color-text-secondary)] sm:text-base'>
                      <p className='whitespace-pre-line break-words'>{culture.overview}</p>
                    </div>
                  </div>
                )}

                {hasProgram && (
                  <div className={hasOverview ? 'mt-8 border-t border-[var(--color-detail-divider)] pt-7' : undefined}>
                    <h2 className='text-base font-semibold tracking-tight text-[var(--color-text-primary)]'>
                      프로그램
                    </h2>
                    <div className='mt-4 max-w-[68ch] text-[0.9375rem] leading-[1.85] text-[var(--color-text-secondary)] sm:text-base'>
                      <p className='whitespace-pre-line break-words'>{culture.programIntroduction}</p>
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className='mt-12 border-t border-[var(--color-detail-divider)] pt-7 sm:mt-14 sm:pt-8'>
              <h2 className='text-base font-semibold tracking-tight text-[var(--color-text-primary)]'>오시는 길</h2>
              <p className='mt-2 max-w-[68ch] text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-[0.9375rem]'>
                {fullAddress || '장소 정보가 없습니다.'}
              </p>

              <div className='mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs'>
                <a
                  href={kakaoNavUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1.5 rounded-md px-1 py-1 font-medium text-[var(--color-text-primary)] underline decoration-[var(--color-detail-divider)] underline-offset-4 transition hover:text-[var(--color-brand-primary)] hover:decoration-[var(--color-brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
                >
                  <Navigation className='size-3.5 text-[var(--color-brand-primary)]' strokeWidth={1.8} />
                  <span>카카오맵</span>
                  <ExternalLink className='size-3 text-[var(--color-text-tertiary)]' strokeWidth={1.8} />
                </a>

                <a
                  href={naverNavUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1.5 rounded-md px-1 py-1 font-medium text-[var(--color-text-primary)] underline decoration-[var(--color-detail-divider)] underline-offset-4 transition hover:text-[var(--color-brand-primary)] hover:decoration-[var(--color-brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
                >
                  <span>네이버 지도</span>
                  <ExternalLink className='size-3 text-[var(--color-text-tertiary)]' strokeWidth={1.8} />
                </a>
              </div>
            </section>

            {visibleAdditionalInformation.length > 0 && (
              <details open className='group mt-10 border-t border-[var(--color-detail-divider)] pt-4'>
                <summary className='flex cursor-pointer list-none items-center justify-between gap-4 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]'>
                  <span>추가 안내</span>
                  <ChevronDown
                    className='size-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200 group-open:rotate-180'
                    strokeWidth={1.8}
                  />
                </summary>
                <dl className='mt-3 space-y-4 pb-2 text-xs leading-relaxed text-[var(--color-text-secondary)] sm:text-sm'>
                  {visibleAdditionalInformation.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className='sm:grid sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-3'>
                      <dt className='font-semibold text-[var(--color-text-primary)]'>{item.name}</dt>
                      <dd className='whitespace-pre-line break-words'>{item.text}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
          </div>
        </div>
      </main>

      <footer className='fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-detail-divider)] bg-[var(--color-surface-primary)] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_-18px_rgba(15,23,42,0.26)] transition-colors lg:hidden'>
        <div className='mx-auto flex max-w-lg items-center justify-between gap-2'>
          <Link
            href={mapExploreUrl}
            aria-label='지도에서 위치 보기'
            className='flex size-10 items-center justify-center rounded-lg border border-[var(--color-detail-divider)] bg-transparent text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-chip)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
            title='지도에서 위치 보기'
          >
            <Compass className='size-4' strokeWidth={1.8} />
          </Link>

          {primaryExternalUrl ? (
            <a
              href={primaryExternalUrl}
              target='_blank'
              rel='noreferrer'
              className='flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--color-brand-primary)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-[0.98]'
            >
              <span>{primaryExternalLabel}</span>
              <ExternalLink className='size-3.5 shrink-0' strokeWidth={1.8} />
            </a>
          ) : (
            <Link
              href={mapExploreUrl}
              className='flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--color-brand-primary)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-[0.98]'
            >
              <Compass className='size-4 shrink-0' strokeWidth={1.8} />
              <span>지도에서 위치 확인하기</span>
            </Link>
          )}
        </div>
      </footer>

    </div>
  );
};

export default React.memo(CultureDetailView);
