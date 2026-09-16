'use client';

import CultureImageFallback from '@/components/Common/CultureImageFallback';
import { FormattedCultureListItem } from '@/types/culture';
import { getCultureTimingStatus } from '@/utils/cultureTimingStatus';
import { GeoPoint, calculateDistanceMeters, formatDistance } from '@/utils/geo';

import React, { useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Navigation } from 'lucide-react';

interface FeedCultureCardProps {
  culture: FormattedCultureListItem;
  currentLocation?: GeoPoint | null;
  onOpenCulture: (culture: FormattedCultureListItem) => void;
  isAboveFold?: boolean;
}

const FEED_IMAGE_SIZES =
  '(min-width: 1280px) 228px, (min-width: 1024px) calc((100vw - 124px) / 4), (min-width: 768px) calc((100vw - 88px) / 3), (min-width: 640px) calc((100vw - 68px) / 2), calc((100vw - 46px) / 2)';
const FEED_IMAGE_QUALITY = 65;

const FeedCultureCard = ({
  culture,
  currentLocation = null,
  onOpenCulture,
  isAboveFold = false,
}: FeedCultureCardProps) => {
  const [imgSrc, setImgSrc] = useState(culture.mainImage);
  const [imageFailed, setImageFailed] = useState(false);

  const hasCultureImage =
    typeof imgSrc === 'string' && Boolean(imgSrc.trim()) && !imageFailed && !imgSrc.includes('/assets/images/logo');

  const distance = useMemo(() => {
    return currentLocation
      ? formatDistance(calculateDistanceMeters(currentLocation, { lat: culture.lat, lng: culture.lng }))
      : null;
  }, [currentLocation, culture.lat, culture.lng]);

  const dDay = useMemo(
    () => getCultureTimingStatus(culture.startDate, culture.endDate),
    [culture.startDate, culture.endDate]
  );
  const isFree = culture.isFree.includes('무료') || culture.useFee?.includes('무료');
  const accessibleLabel = [
    dDay?.text,
    isFree ? '무료' : null,
    !hasCultureImage ? culture.classification || '문화행사' : null,
    culture.classification || '문화행사',
    '·',
    culture.guName || '전국',
    distance ? '·' : null,
    distance,
    culture.title,
    culture.displayDate,
    culture.displayPlace,
    !isFree ? culture.displayPrice : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={`feed-card flex flex-col rounded-xl ${isAboveFold ? 'feed-card-above-fold' : ''}`}>
      <Link
        href={`/cultures/${culture.id}`}
        onClick={() => onOpenCulture(culture)}
        aria-label={!hasCultureImage ? accessibleLabel : undefined}
        className='group flex cursor-pointer flex-col rounded-xl transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-[0.98]'
      >
        {/* Poster Artwork Container (Clean hairline border, no arbitrary gradient overlay) */}
        <div className='relative aspect-[1/1.38] w-full overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)]'>
          {hasCultureImage ? (
            <Image
              src={imgSrc}
              alt=''
              aria-hidden='true'
              fill
              sizes={FEED_IMAGE_SIZES}
              quality={FEED_IMAGE_QUALITY}
              loading={isAboveFold ? 'eager' : 'lazy'}
              fetchPriority={isAboveFold ? 'high' : 'auto'}
              onError={() => setImageFailed(true)}
              className='object-cover transition-transform duration-300 ease-[var(--spring-smooth)] group-hover:scale-[1.03]'
            />
          ) : (
            <CultureImageFallback
              compact
              classification={culture.classification}
              priority={isAboveFold}
              decorative
            />
          )}

          {/* Minimal status badge (Only essential signal) */}
          {(dDay || isFree) && (
            <div className='pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1'>
              {dDay && (
                <span
                  className={`rounded-md px-2 py-0.5 text-[0.68rem] font-bold shadow-xs ${
                    dDay.variant === 'urgent'
                      ? 'bg-[var(--color-status-error-solid)] text-[var(--color-error-on-primary)]'
                      : dDay.variant === 'ongoing' || dDay.variant === 'upcoming'
                        ? 'bg-[var(--color-status-info-solid)] text-[var(--color-info-on-primary)]'
                        : 'bg-[var(--color-status-neutral)] text-[var(--color-status-neutral-on)]'
                  }`}
                >
                  {dDay.text}
                </span>
              )}
              {isFree && (
                <span className='rounded-md bg-[var(--color-status-success-solid)] px-2 py-0.5 text-[0.68rem] font-bold text-[var(--color-success-on-primary)] shadow-xs'>
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
            <span className='font-semibold text-[var(--color-brand-primary)]'>
              {culture.classification || '문화행사'}
            </span>
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
            className='text-sm font-semibold leading-snug tracking-tight text-[var(--color-text-primary)] transition-colors duration-150 group-hover:text-[var(--color-brand-primary)] sm:text-[0.98rem]'
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
                <span className='shrink-0 font-medium text-[var(--color-text-primary)]'>{culture.displayPrice}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default React.memo(FeedCultureCard);
