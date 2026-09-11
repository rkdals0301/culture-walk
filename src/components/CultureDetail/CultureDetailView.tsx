'use client';

import CultureCategoryBadge from '@/components/Common/CultureCategoryBadge';
import CultureImageFallback from '@/components/Common/CultureImageFallback';
import ThemeToggleButton from '@/components/Theme/ThemeToggleButton';
import type { FormattedCulture } from '@/types/culture';
import { getCulturePriceTone } from '@/utils/cultureUtils';

import React, { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  Info,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Sparkles,
  Ticket,
  Users,
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
  free: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  partial: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  paid: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  unknown: 'bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)]',
} as const;

const CultureDetailView = ({ culture }: CultureDetailViewProps) => {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState<string | undefined>(culture.mainImage);
  const [imageFailed, setImageFailed] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const dday = useMemo(() => getDDayText(culture.startDate, culture.endDate), [culture.startDate, culture.endDate]);
  const priceTone = getCulturePriceTone(culture);

  const hasCultureImage =
    typeof activeImage === 'string' &&
    Boolean(activeImage.trim()) &&
    !imageFailed &&
    !activeImage.includes('/assets/images/logo');

  const fullAddress = culture.place || culture.guName || '';

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
      toast.success('주소가 클립보드에 복사되었습니다.');
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
        toast.success('행사 링크가 클립보드에 복사되었습니다.');
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
    <div id='culture-detail-scroll-container' className='relative h-full overflow-y-auto bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] transition-colors'>
      {/* 1. Glassmorphism Sticky Navigation Header */}
      <header className='sticky top-0 z-40 border-b border-[var(--color-border-primary)] bg-[var(--color-surface-primary)]/85 shadow-2xs backdrop-blur-xl transition-colors'>
        <div className='mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:h-16 sm:px-6'>
          {/* Back Button */}
          <button
            type='button'
            onClick={handleBack}
            aria-label='이전 페이지로 돌아가기'
            className='flex size-10 items-center justify-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-primary)] shadow-2xs transition-all hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-border-control)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]'
          >
            <ArrowLeft className='size-5' strokeWidth={2.2} />
          </button>

          {/* Header Title (Truncated) */}
          <div className='flex min-w-0 flex-1 items-center justify-center px-3'>
            <span className='truncate text-sm font-bold text-[var(--color-text-primary)] sm:text-base'>
              {culture.title}
            </span>
          </div>

          {/* Action Buttons: Share & Theme Toggle */}
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={handleShare}
              aria-label='행사 링크 공유하기'
              className='flex size-10 items-center justify-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-primary)] shadow-2xs transition-all hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-border-control)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]'
            >
              <Share2 className='size-4' strokeWidth={2} />
            </button>
            <ThemeToggleButton />
          </div>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className='mx-auto max-w-4xl px-4 pb-28 pt-4 sm:px-6 sm:pb-32 sm:pt-6'>
        {/* Poster & Ambient Backdrop Section */}
        <section className='relative overflow-hidden rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] p-3 shadow-xl sm:p-5'>
          {/* Ambient blurred backdrop glow */}
          {hasCultureImage && (
            <div className='pointer-events-none absolute inset-0 select-none overflow-hidden' aria-hidden='true'>
              <Image
                src={activeImage}
                alt=''
                fill
                sizes='300px'
                className='scale-150 object-cover opacity-25 blur-3xl'
                priority
              />
              <div className='absolute inset-0 bg-gradient-to-b from-transparent via-[var(--color-bg-primary)]/40 to-[var(--color-bg-primary)]' />
            </div>
          )}

          {/* High-res Poster Card */}
          <div className='relative z-10 mx-auto flex aspect-[3/4] max-h-[480px] w-full max-w-[360px] items-center justify-center overflow-hidden rounded-2xl bg-black/10 shadow-lg sm:max-h-[520px]'>
            {hasCultureImage ? (
              <Image
                src={activeImage}
                alt={culture.title}
                fill
                sizes='(min-width: 640px) 360px, 90vw'
                className='object-contain drop-shadow-md'
                priority
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className='size-full'>
                <CultureImageFallback classification={culture.classification || '문화행사'} />
              </div>
            )}

            {/* Overlaid Badges */}
            <div className='absolute left-3 top-3 flex flex-wrap gap-1.5'>
              {dday && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-black shadow-md ${
                    dday.variant === 'urgent'
                      ? 'bg-rose-500 text-white'
                      : dday.variant === 'upcoming'
                        ? 'bg-sky-500 text-white'
                        : 'bg-zinc-900/80 text-white backdrop-blur-md'
                  }`}
                >
                  {dday.text}
                </span>
              )}
              {priceTone === 'free' && (
                <span className='rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-black text-white shadow-md'>
                  무료
                </span>
              )}
            </div>
          </div>

          {/* Additional Photos Carousel */}
          {(culture.additionalImages ?? []).length > 0 && (
            <div className='relative z-10 mt-4 flex gap-2.5 overflow-x-auto pb-1' aria-label='추가 사진 목록'>
              {(culture.additionalImages ?? []).map(img => (
                <button
                  type='button'
                  key={img.url}
                  onClick={() => {
                    setActiveImage(img.url);
                    setImageFailed(false);
                  }}
                  className={`relative size-16 shrink-0 overflow-hidden rounded-xl border bg-[var(--color-surface-secondary)] transition-all active:scale-95 ${
                    activeImage === img.url
                      ? 'border-[var(--color-brand-primary)] ring-2 ring-[var(--color-brand-primary)]/40 shadow-sm'
                      : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-control)] opacity-70 hover:opacity-100'
                  }`}
                  aria-label='사진 크게 보기'
                >
                  <Image
                    src={img.thumbnailUrl || img.url}
                    alt=''
                    fill
                    sizes='64px'
                    className='object-cover'
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* 3. Header & Title Section */}
        <section className='mt-6 sm:mt-8'>
          {/* Category & Region Pill Badges */}
          <div className='flex flex-wrap items-center gap-2'>
            <CultureCategoryBadge classification={culture.classification} className='px-3 py-1 text-xs' />
            {culture.guName && (
              <span className='rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)] shadow-2xs'>
                {culture.guName}
              </span>
            )}
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold shadow-2xs ${PRICE_BADGE_STYLE[priceTone]}`}
            >
              {culture.displayPrice || (priceTone === 'free' ? '무료' : '요금 정보 확인')}
            </span>
          </div>

          {/* Event Title */}
          <h1 className='mt-3 text-2xl font-black leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-3xl lg:text-4xl'>
            {culture.title}
          </h1>
        </section>

        {/* 4. Trendy Bento Information Grid */}
        <section className='mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4'>
          {/* Bento Tile 1: 일시 */}
          <div className='surface-card flex flex-col justify-between rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)]/70 p-4 shadow-2xs transition-all hover:border-[var(--color-border-control)] sm:p-5'>
            <div className='flex items-center gap-2.5 text-[var(--color-brand-primary)]'>
              <div className='flex size-8 items-center justify-center rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]'>
                <Calendar className='size-4' strokeWidth={2.2} />
              </div>
              <span className='text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]'>행사 일정</span>
            </div>
            <div className='mt-3'>
              <p className='text-base font-extrabold text-[var(--color-text-primary)] sm:text-lg'>
                {culture.displayDate}
              </p>
              {culture.eventTime && (
                <div className='mt-1.5 flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]'>
                  <Clock className='size-3.5 text-[var(--color-text-tertiary)]' />
                  <span>{culture.eventTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bento Tile 2: 장소 & 주소 */}
          <div className='surface-card flex flex-col justify-between rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)]/70 p-4 shadow-2xs transition-all hover:border-[var(--color-border-control)] sm:p-5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2.5 text-[var(--color-brand-primary)]'>
                <div className='flex size-8 items-center justify-center rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]'>
                  <MapPin className='size-4' strokeWidth={2.2} />
                </div>
                <span className='text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]'>행사 장소</span>
              </div>
              {fullAddress && (
                <button
                  type='button'
                  onClick={handleCopyAddress}
                  className='flex items-center gap-1 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-all hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-text-primary)] active:scale-95'
                  title='주소 복사'
                >
                  {copiedAddress ? <Check className='size-3 text-emerald-500' /> : <Copy className='size-3' />}
                  <span>{copiedAddress ? '복사됨' : '복사'}</span>
                </button>
              )}
            </div>
            <div className='mt-3'>
              <p className='text-base font-extrabold text-[var(--color-text-primary)] sm:text-lg'>
                {culture.place || culture.guName}
              </p>
              {culture.placeInformation && (
                <p className='mt-1 text-xs text-[var(--color-text-secondary)]'>{culture.placeInformation}</p>
              )}
            </div>
          </div>

          {/* Bento Tile 3: 관람료 & 예매 */}
          <div className='surface-card flex flex-col justify-between rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)]/70 p-4 shadow-2xs transition-all hover:border-[var(--color-border-control)] sm:p-5'>
            <div className='flex items-center gap-2.5 text-[var(--color-brand-primary)]'>
              <div className='flex size-8 items-center justify-center rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]'>
                <Ticket className='size-4' strokeWidth={2.2} />
              </div>
              <span className='text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]'>관람료 / 요금</span>
            </div>
            <div className='mt-3'>
              <p className='text-base font-extrabold text-[var(--color-text-primary)] sm:text-lg'>
                {culture.useFee || culture.displayPrice}
              </p>
              {culture.bookingPlace && (
                <p className='mt-1 text-xs text-[var(--color-text-secondary)]'>예매처: {culture.bookingPlace}</p>
              )}
            </div>
          </div>

          {/* Bento Tile 4: 관람 대상 & 문의처 */}
          <div className='surface-card flex flex-col justify-between rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)]/70 p-4 shadow-2xs transition-all hover:border-[var(--color-border-control)] sm:p-5'>
            <div className='flex items-center gap-2.5 text-[var(--color-brand-primary)]'>
              <div className='flex size-8 items-center justify-center rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)]'>
                <Users className='size-4' strokeWidth={2.2} />
              </div>
              <span className='text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]'>대상 & 주최</span>
            </div>
            <div className='mt-3'>
              <p className='text-base font-extrabold text-[var(--color-text-primary)] sm:text-lg'>
                {culture.useTarget || '누구나 관람 가능'}
              </p>
              <div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-secondary)]'>
                {culture.organizationName && <span>{culture.organizationName}</span>}
                {culture.contact && (
                  <a
                    href={`tel:${culture.contact.replace(/[^0-9-]/g, '')}`}
                    className='inline-flex items-center gap-1 font-semibold text-[var(--color-brand-primary)] hover:underline'
                  >
                    <Phone className='size-3' />
                    <span>{culture.contact}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Editorial Overview / Story Section */}
        {culture.overview && (
          <section className='mt-8 rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] p-5 shadow-sm sm:mt-10 sm:p-7'>
            <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)]'>
              <Sparkles className='size-4' />
              <span>행사 소개</span>
            </div>
            <div className='mt-4 leading-relaxed text-[var(--color-text-secondary)] sm:text-base'>
              <p className='whitespace-pre-line break-words'>{culture.overview}</p>
            </div>
          </section>
        )}

        {/* 6. Program Details Section */}
        {culture.programIntroduction && (
          <section className='mt-6 rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] p-5 shadow-sm sm:p-7'>
            <h2 className='text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)]'>
              주요 프로그램
            </h2>
            <div className='mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base'>
              <p className='whitespace-pre-line break-words'>{culture.programIntroduction}</p>
            </div>
          </section>
        )}

        {/* 7. Location & Map Bridge Section */}
        <section className='mt-8 rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)]/50 p-5 shadow-sm sm:mt-10 sm:p-7'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Compass className='size-5 text-[var(--color-brand-primary)]' />
              <h2 className='text-base font-extrabold text-[var(--color-text-primary)] sm:text-lg'>
                오시는 길 & 주변 탐색
              </h2>
            </div>
          </div>

          <p className='mt-2 text-sm text-[var(--color-text-secondary)]'>
            {fullAddress}
          </p>

          <div className='mt-4 flex flex-wrap gap-2.5 sm:gap-3'>
            {/* Direct Bridge to CultureWalk Map */}
            <Link
              href={mapExploreUrl}
              className='flex h-11 items-center gap-2 rounded-xl bg-[var(--color-brand-primary)] px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-[var(--color-brand-hover)] active:scale-95'
            >
              <Compass className='size-4' />
              <span>문화지도에서 주변 행사 보기</span>
            </Link>

            {/* Kakao Map Navigation Link */}
            <a
              href={kakaoNavUrl}
              target='_blank'
              rel='noreferrer'
              className='flex h-11 items-center gap-1.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-3.5 text-xs font-bold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-chip)] active:scale-95'
            >
              <Navigation className='size-3.5' />
              <span>카카오맵 길찾기</span>
              <ExternalLink className='size-3 text-[var(--color-text-tertiary)]' />
            </a>

            {/* Naver Map Search Link */}
            <a
              href={naverNavUrl}
              target='_blank'
              rel='noreferrer'
              className='flex h-11 items-center gap-1.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-3.5 text-xs font-bold text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-chip)] active:scale-95'
            >
              <span>네이버 지도</span>
              <ExternalLink className='size-3 text-[var(--color-text-tertiary)]' />
            </a>
          </div>
        </section>

        {/* 8. Collapsible Additional Information */}
        {(culture.additionalInformation ?? []).length > 0 && (
          <details className='group mt-6 rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] p-4 shadow-2xs sm:p-5'>
            <summary className='flex cursor-pointer list-none items-center justify-between font-bold text-[var(--color-text-primary)] text-sm'>
              <span className='flex items-center gap-2'>
                <Info className='size-4 text-[var(--color-brand-primary)]' />
                <span>기타 상세 안내 및 유의사항</span>
              </span>
              <ChevronDown className='size-4 text-[var(--color-text-tertiary)] transition-transform duration-200 group-open:rotate-180' />
            </summary>
            <dl className='mt-4 grid gap-3 border-t border-[var(--color-border-primary)] pt-4 text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)]'>
              {(culture.additionalInformation ?? []).map((item, idx) => (
                <div key={`${item.name}-${idx}`} className='grid grid-cols-[5rem_1fr] gap-2'>
                  <dt className='font-bold text-[var(--color-text-primary)]'>{item.name}</dt>
                  <dd className='whitespace-pre-line break-words'>{item.text}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
      </main>

      {/* 9. Floating Bottom Action Bar */}
      <footer className='fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border-primary)] bg-[var(--color-surface-primary)]/90 p-3 shadow-2xl backdrop-blur-xl transition-colors pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:p-4'>
        <div className='mx-auto flex max-w-4xl items-center justify-between gap-3'>
          {/* Quick Bridge Buttons */}
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={handleShare}
              aria-label='공유하기'
              className='flex size-11 items-center justify-center rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-secondary)] active:scale-95'
              title='공유하기'
            >
              <Share2 className='size-4' strokeWidth={2} />
            </button>
            <Link
              href={mapExploreUrl}
              aria-label='지도에서 위치 보기'
              className='flex size-11 items-center justify-center rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-surface-secondary)] active:scale-95'
              title='지도에서 위치 보기'
            >
              <Compass className='size-4' strokeWidth={2} />
            </Link>
          </div>

          {/* Primary Action Button */}
          {primaryExternalUrl ? (
            <a
              href={primaryExternalUrl}
              target='_blank'
              rel='noreferrer'
              className='flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand-primary)] px-6 text-sm font-extrabold text-white shadow-md transition-all hover:bg-[var(--color-brand-hover)] active:scale-[0.98]'
            >
              <span>{primaryExternalLabel}</span>
              <ExternalLink className='size-4' strokeWidth={2.2} />
            </a>
          ) : (
            <Link
              href={mapExploreUrl}
              className='flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand-primary)] px-6 text-sm font-extrabold text-white shadow-md transition-all hover:bg-[var(--color-brand-hover)] active:scale-[0.98]'
            >
              <Compass className='size-4' />
              <span>지도에서 위치 확인하기</span>
            </Link>
          )}
        </div>
      </footer>
    </div>
  );
};

export default React.memo(CultureDetailView);
