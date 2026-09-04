'use client';

import CultureImageFallback from '@/components/Common/CultureImageFallback';
import { FormattedCulture } from '@/types/culture';
import { GeoPoint, calculateDistanceMeters, formatDistance } from '@/utils/geo';

import React, { useMemo, useState } from 'react';

import Image from 'next/image';

import { Navigation } from 'lucide-react';

interface FeedCultureCardProps {
  culture: FormattedCulture;
  currentLocation?: GeoPoint | null;
  onOpenCulture: (culture: FormattedCulture) => void;
  isAboveFold?: boolean;
}

const getDDayText = (startDate?: Date | null, endDate?: Date | null) => {
  if (!endDate) {
    return null;
  }

  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = new Date(endDate);

  // Normalize to start of day in Korea time
  now.setHours(0, 0, 0, 0);
  if (start) start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffTimeToEnd = end.getTime() - now.getTime();
  const diffDaysToEnd = Math.ceil(diffTimeToEnd / (1000 * 60 * 60 * 24));

  if (diffDaysToEnd < 0) {
    return { text: '종료', variant: 'ended' as const };
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

const FeedCultureCard = ({ culture, currentLocation = null, onOpenCulture, isAboveFold = false }: FeedCultureCardProps) => {
  const [imgSrc, setImgSrc] = useState(culture.mainImage);
  const [imageFailed, setImageFailed] = useState(false);

  const hasCultureImage =
    typeof imgSrc === 'string' &&
    Boolean(imgSrc.trim()) &&
    !imageFailed &&
    !imgSrc.includes('/assets/images/logo');

  const distance = useMemo(() => {
    return currentLocation
      ? formatDistance(calculateDistanceMeters(currentLocation, { lat: culture.lat, lng: culture.lng }))
      : null;
  }, [currentLocation, culture.lat, culture.lng]);

  const dDay = useMemo(() => getDDayText(culture.startDate, culture.endDate), [culture.startDate, culture.endDate]);
  const isFree = culture.isFree.includes('무료') || culture.useFee?.includes('무료');

  return (
    <article
      role='button'
      tabIndex={0}
      onClick={() => onOpenCulture(culture)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenCulture(culture);
        }
      }}
      aria-label={`${culture.title}, ${culture.displayDate}, ${culture.displayPlace}`}
      className='group flex flex-col cursor-pointer transition-transform duration-150 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] rounded-xl'
    >
      {/* Poster Artwork Container (Clean hairline border, no arbitrary gradient overlay) */}
      <div className='relative aspect-[1/1.38] w-full overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)]'>
        {hasCultureImage ? (
          <Image
            src={imgSrc}
            alt={culture.title}
            fill
            sizes='(min-width: 1536px) 20vw, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 50vw'
            loading={isAboveFold ? 'eager' : 'lazy'}
            fetchPriority={isAboveFold ? 'high' : 'auto'}
            onError={() => setImageFailed(true)}
            className='object-cover transition-transform duration-300 ease-[var(--spring-smooth)] group-hover:scale-[1.03]'
          />
        ) : (
          <CultureImageFallback compact classification={culture.classification} />
        )}

        {/* Minimal status badge (Only essential signal) */}
        {(dDay || isFree) && (
          <div className='absolute left-2.5 top-2.5 flex items-center gap-1 pointer-events-none'>
            {dDay && (
              <span
                className={`rounded-md px-2 py-0.5 text-[0.68rem] font-bold shadow-xs ${
                  dDay.variant === 'urgent'
                    ? 'bg-[var(--color-error)] text-[var(--color-error-on-primary)]'
                    : dDay.variant === 'ongoing' || dDay.variant === 'upcoming'
                      ? 'bg-[var(--color-info)] text-[var(--color-info-on-primary)]'
                      : 'bg-[var(--color-status-neutral)] text-[var(--color-status-neutral-on)]'
                }`}
              >
                {dDay.text}
              </span>
            )}
            {isFree && (
              <span className='rounded-md bg-[var(--color-success)] px-2 py-0.5 text-[0.68rem] font-bold text-[var(--color-success-on-primary)] shadow-xs'>
                무료
              </span>
            )}
          </div>
        )}
      </div>

      {/* Editorial Content (Directly below poster, no enclosed card padding) */}
      <div className='mt-2.5 flex flex-1 flex-col gap-1'>
        {/* Category & Region */}
        <div className='flex items-center gap-1 text-[0.72rem] font-medium text-[var(--color-text-tertiary)]'>
          <span className='font-semibold text-[var(--color-brand-primary)]'>{culture.classification || '문화행사'}</span>
          <span>·</span>
          <span className='truncate'>{culture.guName || '전국'}</span>
          {distance && (
            <>
              <span>·</span>
              <span className='inline-flex items-center gap-0.5 font-semibold text-[var(--color-brand-primary)]'>
                <Navigation className='size-2.5 fill-current' />
                {distance}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h3
          className='text-sm sm:text-[0.98rem] font-semibold leading-snug tracking-tight text-[var(--color-text-primary)] transition-colors duration-150 group-hover:text-[var(--color-brand-primary)]'
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {culture.title}
        </h3>

        {/* Date & Venue & Fee (Clean typography, no icon clutter) */}
        <div className='mt-0.5 flex flex-col gap-0.5 text-xs text-[var(--color-text-tertiary)]'>
          <span className='truncate'>{culture.displayDate}</span>
          <div className='flex items-center justify-between gap-1'>
            <span className='truncate text-[var(--color-text-secondary)]'>{culture.displayPlace}</span>
            {!isFree && culture.displayPrice && (
              <span className='shrink-0 font-medium text-[var(--color-text-primary)]'>
                {culture.displayPrice}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default React.memo(FeedCultureCard);
