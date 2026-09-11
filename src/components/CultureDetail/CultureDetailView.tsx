'use client';

import CultureCategoryBadge from '@/components/Common/CultureCategoryBadge';
import CultureImageFallback from '@/components/Common/CultureImageFallback';
import ThemeToggleButton from '@/components/Theme/ThemeToggleButton';
import type { FormattedCulture } from '@/types/culture';
import { getCulturePriceTone } from '@/utils/cultureUtils';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  MapPin,
  Maximize2,
  Navigation,
  Phone,
  Share2,
  Ticket,
  Users,
  X,
} from 'lucide-react';

interface CultureDetailViewProps {
  culture: FormattedCulture;
}

const getDDayText = (startDate?: Date | null, endDate?: Date | null) => {
  if (!endDate) return null;

  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = new Date(endDate);

  now.setHours(0, 0, 0, 0);
  if (start) start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTimeToEnd = end.getTime() - now.getTime();
  const diffDaysToEnd = Math.ceil(diffTimeToEnd / (1000 * 60 * 60 * 24));

  if (diffDaysToEnd < 0) {
    return { text: '종료된 행사', variant: 'ended' as const };
  }
  if (diffDaysToEnd === 0) {
    return { text: '오늘 마감', variant: 'urgent' as const };
  }
  if (diffDaysToEnd <= 3) {
    return { text: `D-${diffDaysToEnd} 마감임박`, variant: 'urgent' as const };
  }
  if (start && start > now) {
    const diffDaysToStart = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { text: `D-${diffDaysToStart} 오픈예정`, variant: 'upcoming' as const };
  }

  return { text: '진행중', variant: 'ongoing' as const };
};

const PRICE_BADGE_STYLE = {
  free: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  partial: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  paid: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  unknown: 'bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]',
} as const;

const CultureDetailView = ({ culture }: CultureDetailViewProps) => {
  const router = useRouter();

  // Consolidate all available images into a unified gallery list
  const imageList = useMemo(() => {
    const list: string[] = [];
    if (culture.mainImage && !culture.mainImage.includes('/assets/images/logo')) {
      list.push(culture.mainImage);
    }
    (culture.additionalImages ?? []).forEach(img => {
      if (img.url && !list.includes(img.url)) {
        list.push(img.url);
      }
    });
    return list;
  }, [culture.additionalImages, culture.mainImage]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const currentImageUrl = imageList[currentIndex] || culture.mainImage;

  const dday = useMemo(() => getDDayText(culture.startDate, culture.endDate), [culture.startDate, culture.endDate]);
  const priceTone = getCulturePriceTone(culture);

  const hasCultureImage =
    typeof currentImageUrl === 'string' &&
    Boolean(currentImageUrl.trim()) &&
    !imageFailed &&
    !currentImageUrl.includes('/assets/images/logo');

  const fullAddress = culture.place || culture.guName || '';

  // Gallery Navigation Handlers
  const handlePrevImage = useCallback(() => {
    if (imageList.length <= 1) return;
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : imageList.length - 1));
    setImageFailed(false);
  }, [imageList.length]);

  const handleNextImage = useCallback(() => {
    if (imageList.length <= 1) return;
    setCurrentIndex(prev => (prev < imageList.length - 1 ? prev + 1 : 0));
    setImageFailed(false);
  }, [imageList.length]);

  // Touch Gesture Swipe Handlers (Non-intrusive to vertical scroll)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Trigger only if horizontal swipe dominates vertical scroll and exceeds 35px
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
      if (deltaX < 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  }, [handleNextImage, handlePrevImage]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handleNextImage, handlePrevImage]);

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  const handleCopyAddress = useCallback(async () => {
    if (!fullAddress) return;
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopiedAddress(true);
      toast.success('주소가 복사되었습니다.');
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      toast.error('주소 복사에 실패했습니다.');
    }
  }, [fullAddress]);

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
      className='relative h-full overflow-y-auto bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-colors'
    >
      {/* 1. Refined Minimal Sticky Navigation Header */}
      <header className='sticky top-0 z-40 border-b border-[var(--color-border-primary)]/80 bg-[var(--color-surface-primary)]/90 backdrop-blur-md transition-colors'>
        <div className='mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <button
            type='button'
            onClick={handleBack}
            aria-label='이전 페이지로 돌아가기'
            className='flex size-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-text-primary)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]'
          >
            <ArrowLeft className='size-5' strokeWidth={2} />
          </button>

          <div className='flex min-w-0 flex-1 items-center justify-center px-4'>
            <span className='truncate text-sm font-semibold text-[var(--color-text-primary)]'>
              {culture.title}
            </span>
          </div>

          <div className='flex items-center gap-1'>
            <button
              type='button'
              onClick={handleShare}
              aria-label='행사 링크 공유하기'
              className='flex size-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-text-primary)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]'
            >
              <Share2 className='size-4' strokeWidth={2} />
            </button>
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      {/* 2. Main Editorial Content Container */}
      <main className='mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 sm:pb-32 sm:pt-8 lg:px-8'>
        <div className='lg:grid lg:grid-cols-[380px_1fr] lg:items-start lg:gap-12 xl:grid-cols-[420px_1fr]'>
          {/* Left Column: Poster & Media (Sticky on desktop) */}
          <div className='lg:sticky lg:top-20'>
            {/* Fluid, Responsive Poster Container with Touch Swipe & Zoom */}
            <div
              className='group relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border-primary)]/80 bg-[var(--color-surface-secondary)] shadow-md select-none sm:aspect-[3/4] lg:max-w-none'
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {hasCultureImage ? (
                <div
                  className='relative size-full cursor-zoom-in'
                  onClick={() => setIsLightboxOpen(true)}
                  title='클릭하여 전체 포스터 크게 보기'
                >
                  <Image
                    src={currentImageUrl}
                    alt={culture.title}
                    fill
                    sizes='(min-width: 1024px) 420px, (min-width: 640px) 440px, 100vw'
                    className='object-contain transition-opacity duration-200'
                    priority
                    onError={() => setImageFailed(true)}
                  />
                </div>
              ) : (
                <div className='size-full'>
                  <CultureImageFallback classification={culture.classification || '문화행사'} />
                </div>
              )}

              {/* Status Badges on Poster (Top-Left) */}
              <div className='pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5'>
                {dday && (
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-bold shadow-sm ${
                      dday.variant === 'urgent'
                        ? 'bg-rose-500 text-white'
                        : dday.variant === 'upcoming'
                          ? 'bg-sky-500 text-white'
                          : 'bg-zinc-900/80 text-white backdrop-blur-sm'
                    }`}
                  >
                    {dday.text}
                  </span>
                )}
                {priceTone === 'free' && (
                  <span className='rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white shadow-sm'>
                    무료
                  </span>
                )}
              </div>

              {/* Expand / Lightbox Button (Top-Right) */}
              {hasCultureImage && (
                <button
                  type='button'
                  onClick={e => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  aria-label='포스터 전체화면 크게 보기'
                  className='absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-zinc-900/75 px-2 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur-sm transition hover:bg-zinc-900 active:scale-95'
                >
                  <Maximize2 className='size-3' />
                  <span>크게 보기</span>
                </button>
              )}

              {/* Image Counter Badge (Bottom-Right, when multiple images exist) */}
              {imageList.length > 1 && (
                <div className='pointer-events-none absolute bottom-3 right-3 rounded-md bg-zinc-900/75 px-2 py-0.5 text-xs font-semibold text-white shadow-sm backdrop-blur-sm'>
                  {currentIndex + 1} / {imageList.length}
                </div>
              )}

              {/* Desktop Hover Navigation Arrows */}
              {imageList.length > 1 && (
                <>
                  <button
                    type='button'
                    onClick={e => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    aria-label='이전 사진 보기'
                    className='absolute left-2.5 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-zinc-900/70 text-white opacity-0 shadow-sm backdrop-blur-sm transition hover:bg-zinc-900 group-hover:opacity-100 active:scale-95'
                  >
                    <ChevronLeft className='size-4' />
                  </button>
                  <button
                    type='button'
                    onClick={e => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    aria-label='다음 사진 보기'
                    className='absolute right-2.5 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-zinc-900/70 text-white opacity-0 shadow-sm backdrop-blur-sm transition hover:bg-zinc-900 group-hover:opacity-100 active:scale-95'
                  >
                    <ChevronRight className='size-4' />
                  </button>
                </>
              )}
            </div>

            {/* Additional Photo Thumbnails (Synchronized with Swipe) */}
            {imageList.length > 1 && (
              <div className='mt-3 flex justify-center gap-2 overflow-x-auto pb-1 lg:justify-start' aria-label='추가 사진 목록'>
                {imageList.map((imgUrl, idx) => (
                  <button
                    type='button'
                    key={`${imgUrl}-${idx}`}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setImageFailed(false);
                    }}
                    className={`relative size-14 shrink-0 overflow-hidden rounded-lg border transition-all active:scale-95 ${
                      currentIndex === idx
                        ? 'border-[var(--color-brand-primary)] ring-2 ring-[var(--color-brand-primary)]/30'
                        : 'border-[var(--color-border-primary)]/80 opacity-70 hover:opacity-100'
                    }`}
                    aria-label={`사진 ${idx + 1} 선택`}
                  >
                    <Image
                      src={imgUrl}
                      alt=''
                      fill
                      sizes='56px'
                      className='object-cover'
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Desktop Primary Action Shortcuts (Hidden on mobile, bottom bar is used on mobile) */}
            <div className='mt-6 hidden lg:flex lg:flex-col lg:gap-2.5'>
              {primaryExternalUrl && (
                <a
                  href={primaryExternalUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-primary)] px-5 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--color-brand-hover)] active:scale-[0.99]'
                >
                  <span>{primaryExternalLabel}</span>
                  <ExternalLink className='size-4' />
                </a>
              )}
              <Link
                href={mapExploreUrl}
                className='flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-4 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-chip)] active:scale-[0.99]'
              >
                <Compass className='size-3.5 text-[var(--color-brand-primary)]' />
                <span>문화지도에서 위치 확인</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Title, Metadata, Editorial Story & Details */}
          <div className='mt-6 lg:mt-0'>
            {/* Header & Badges */}
            <div className='flex flex-wrap items-center gap-1.5'>
              <CultureCategoryBadge classification={culture.classification} className='px-2.5 py-0.5 text-xs' />
              {culture.guName && (
                <span className='rounded-md border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]'>
                  {culture.guName}
                </span>
              )}
              <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${PRICE_BADGE_STYLE[priceTone]}`}>
                {culture.displayPrice || (priceTone === 'free' ? '무료' : '요금 정보 확인')}
              </span>
            </div>

            <h1 className='mt-3 text-2xl font-bold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-3xl lg:text-4xl'>
              {culture.title}
            </h1>

            {/* 3. Unified Information List (Anti-Card Design) */}
            <section className='mt-8 border-y border-[var(--color-border-primary)] divide-y divide-[var(--color-border-primary)]/70 text-sm'>
              {/* Row 1: 일시 */}
              <div className='py-3.5 sm:grid sm:grid-cols-[5.5rem_1fr] sm:gap-4 sm:items-baseline'>
                <div className='flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase'>
                  <Calendar className='size-3.5 text-[var(--color-brand-primary)]' />
                  <span>일시</span>
                </div>
                <div className='mt-1 sm:mt-0 font-medium text-[var(--color-text-primary)]'>
                  <span>{culture.displayDate}</span>
                  {culture.eventTime && (
                    <span className='ml-2 inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)]'>
                      <Clock className='size-3 text-[var(--color-text-tertiary)]' />
                      <span>{culture.eventTime}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: 장소 */}
              <div className='py-3.5 sm:grid sm:grid-cols-[5.5rem_1fr] sm:gap-4 sm:items-baseline'>
                <div className='flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase'>
                  <MapPin className='size-3.5 text-[var(--color-brand-primary)]' />
                  <span>장소</span>
                </div>
                <div className='mt-1 sm:mt-0 flex flex-wrap items-center justify-between gap-2 font-medium text-[var(--color-text-primary)]'>
                  <div>
                    <span>{culture.place || culture.guName}</span>
                    {culture.placeInformation && (
                      <span className='ml-2 text-xs text-[var(--color-text-secondary)] font-normal'>
                        ({culture.placeInformation})
                      </span>
                    )}
                  </div>
                  {fullAddress && (
                    <button
                      type='button'
                      onClick={handleCopyAddress}
                      className='inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-text-primary)] transition active:scale-95'
                      title='주소 복사'
                    >
                      {copiedAddress ? <Check className='size-3 text-emerald-500' /> : <Copy className='size-3' />}
                      <span>{copiedAddress ? '복사됨' : '주소복사'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Row 3: 관람료 / 예매 */}
              <div className='py-3.5 sm:grid sm:grid-cols-[5.5rem_1fr] sm:gap-4 sm:items-baseline'>
                <div className='flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase'>
                  <Ticket className='size-3.5 text-[var(--color-brand-primary)]' />
                  <span>관람료</span>
                </div>
                <div className='mt-1 sm:mt-0 font-medium text-[var(--color-text-primary)]'>
                  <span>{culture.useFee || culture.displayPrice}</span>
                  {culture.bookingPlace && (
                    <span className='ml-2 text-xs text-[var(--color-text-secondary)] font-normal'>
                      · 예매처: {culture.bookingPlace}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 4: 대상 / 주최 / 문의 */}
              <div className='py-3.5 sm:grid sm:grid-cols-[5.5rem_1fr] sm:gap-4 sm:items-baseline'>
                <div className='flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-tertiary)] uppercase'>
                  <Users className='size-3.5 text-[var(--color-brand-primary)]' />
                  <span>대상·문의</span>
                </div>
                <div className='mt-1 sm:mt-0 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-medium text-[var(--color-text-primary)]'>
                  <span>{culture.useTarget || '누구나 관람 가능'}</span>
                  {culture.organizationName && (
                    <span className='text-xs text-[var(--color-text-secondary)] font-normal'>
                      · {culture.organizationName}
                    </span>
                  )}
                  {culture.contact && (
                    <a
                      href={`tel:${culture.contact.replace(/[^0-9-]/g, '')}`}
                      className='inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)] hover:underline'
                    >
                      <Phone className='size-3' />
                      <span>{culture.contact}</span>
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* 4. Editorial Story / Overview (Clean natural section without card borders) */}
            {culture.overview && (
              <section className='mt-10 sm:mt-12'>
                <h2 className='text-lg font-bold tracking-tight text-[var(--color-text-primary)]'>
                  행사 소개
                </h2>
                <div className='mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base'>
                  <p className='whitespace-pre-line break-words'>{culture.overview}</p>
                </div>
              </section>
            )}

            {/* 5. Program Introduction (Clean Editorial Typography, No AI callout box) */}
            {culture.programIntroduction && (
              <section className='mt-8 sm:mt-10'>
                <h2 className='text-lg font-bold tracking-tight text-[var(--color-text-primary)]'>
                  주요 프로그램
                </h2>
                <div className='mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base'>
                  <p className='whitespace-pre-line break-words'>{culture.programIntroduction}</p>
                </div>
              </section>
            )}

            {/* 6. Location & Map Bridge */}
            <section className='mt-10 border-t border-[var(--color-border-primary)] pt-8 sm:mt-12'>
              <h2 className='text-lg font-bold tracking-tight text-[var(--color-text-primary)]'>
                오시는 길
              </h2>
              <p className='mt-2 text-sm text-[var(--color-text-secondary)]'>
                {fullAddress}
              </p>

              <div className='mt-4 flex flex-wrap gap-2.5'>
                <Link
                  href={mapExploreUrl}
                  className='flex h-10 items-center gap-2 rounded-lg bg-[var(--color-brand-primary)] px-4 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--color-brand-hover)] active:scale-95'
                >
                  <Compass className='size-3.5' />
                  <span>문화지도에서 주변 행사 보기</span>
                </Link>

                <a
                  href={kakaoNavUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='flex h-10 items-center gap-1.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-3 text-xs font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-chip)] active:scale-95'
                >
                  <Navigation className='size-3 text-[var(--color-text-tertiary)]' />
                  <span>카카오맵</span>
                  <ExternalLink className='size-3 text-[var(--color-text-tertiary)]' />
                </a>

                <a
                  href={naverNavUrl}
                  target='_blank'
                  rel='noreferrer'
                  className='flex h-10 items-center gap-1.5 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-3 text-xs font-medium text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-chip)] active:scale-95'
                >
                  <span>네이버 지도</span>
                  <ExternalLink className='size-3 text-[var(--color-text-tertiary)]' />
                </a>
              </div>
            </section>

            {/* 7. Collapsible Additional Information (Clean hairline disclosure) */}
            {(culture.additionalInformation ?? []).length > 0 && (
              <details className='group mt-8 border-t border-[var(--color-border-primary)] pt-4'>
                <summary className='flex cursor-pointer list-none items-center justify-between py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition'>
                  <span>기타 상세 안내 및 유의사항</span>
                  <ChevronDown className='size-4 text-[var(--color-text-tertiary)] transition-transform duration-200 group-open:rotate-180' />
                </summary>
                <dl className='mt-3 space-y-2.5 pb-2 text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)]'>
                  {(culture.additionalInformation ?? []).map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className='sm:grid sm:grid-cols-[6rem_1fr] sm:gap-2'>
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

      {/* 8. Mobile Floating Bottom Action Bar (Hidden on desktop) */}
      <footer className='fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border-primary)] bg-[var(--color-surface-primary)]/95 p-3 shadow-lg backdrop-blur-md transition-colors pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:hidden'>
        <div className='mx-auto flex max-w-lg items-center justify-between gap-2.5'>
          <button
            type='button'
            onClick={handleShare}
            aria-label='공유하기'
            className='flex size-11 items-center justify-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-secondary)] active:scale-95'
            title='공유하기'
          >
            <Share2 className='size-4' strokeWidth={2} />
          </button>
          <Link
            href={mapExploreUrl}
            aria-label='지도에서 위치 보기'
            className='flex size-11 items-center justify-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-secondary)] active:scale-95'
            title='지도에서 위치 보기'
          >
            <Compass className='size-4' strokeWidth={2} />
          </Link>

          {primaryExternalUrl ? (
            <a
              href={primaryExternalUrl}
              target='_blank'
              rel='noreferrer'
              className='flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-brand-primary)] px-4 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--color-brand-hover)] active:scale-[0.98]'
            >
              <span>{primaryExternalLabel}</span>
              <ExternalLink className='size-3.5' strokeWidth={2} />
            </a>
          ) : (
            <Link
              href={mapExploreUrl}
              className='flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-brand-primary)] px-4 text-sm font-bold text-white shadow-xs transition hover:bg-[var(--color-brand-hover)] active:scale-[0.98]'
            >
              <Compass className='size-4' />
              <span>지도에서 위치 확인하기</span>
            </Link>
          )}
        </div>
      </footer>

      {/* 9. Full-Screen Uncropped Lightbox (크게 보기 모달 - 원본 비율 100% 무손실 뷰) */}
      {isLightboxOpen && hasCultureImage && (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='포스터 전체화면 크게 보기'
          className='fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md select-none'
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Top Control Bar */}
          <div
            className='flex h-14 shrink-0 items-center justify-between px-4 text-white sm:px-6'
            onClick={e => e.stopPropagation()}
          >
            <div className='flex items-center gap-2'>
              <span className='rounded-md bg-white/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-zinc-200'>
                {imageList.length > 1 ? `${currentIndex + 1} / ${imageList.length}` : '원본 포스터'}
              </span>
              <span className='hidden text-xs text-zinc-400 sm:inline'>
                클릭 또는 ESC 키로 닫기
              </span>
            </div>

            <button
              type='button'
              onClick={() => setIsLightboxOpen(false)}
              aria-label='확대 보기 닫기'
              className='flex size-10 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white active:scale-95'
            >
              <X className='size-5' strokeWidth={2} />
            </button>
          </div>

          {/* Lightbox Center Image Viewport */}
          <div
            className='relative flex flex-1 items-center justify-center overflow-hidden p-4'
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={e => e.stopPropagation()}
          >
            <Image
              src={currentImageUrl}
              alt={culture.title}
              fill
              sizes='100vw'
              className='object-contain select-none'
              priority
            />

            {/* Lightbox Nav Arrows (when multiple images) */}
            {imageList.length > 1 && (
              <>
                <button
                  type='button'
                  onClick={handlePrevImage}
                  aria-label='이전 사진'
                  className='absolute left-3 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-zinc-900/80 text-white shadow-lg backdrop-blur-sm transition hover:bg-zinc-800 active:scale-95'
                >
                  <ChevronLeft className='size-6' />
                </button>
                <button
                  type='button'
                  onClick={handleNextImage}
                  aria-label='다음 사진'
                  className='absolute right-3 top-1/2 -translate-y-1/2 flex size-11 items-center justify-center rounded-full bg-zinc-900/80 text-white shadow-lg backdrop-blur-sm transition hover:bg-zinc-800 active:scale-95'
                >
                  <ChevronRight className='size-6' />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Bottom Footer Notice */}
          <div className='pb-6 pt-2 text-center text-xs text-zinc-400'>
            {imageList.length > 1 ? (
              <span>좌우 스와이프 또는 키보드 방향키(←, →)로 사진을 넘길 수 있습니다</span>
            ) : (
              <span>화면 빈 곳을 탭하거나 닫기(X)를 누르면 상세 페이지로 돌아갑니다</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CultureDetailView);
