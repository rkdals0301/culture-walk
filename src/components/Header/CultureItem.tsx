import CultureCategoryBadge from '@/components/Common/CultureCategoryBadge';
import CultureImageFallback from '@/components/Common/CultureImageFallback';
import { FormattedCulture } from '@/types/culture';
import { GeoPoint, calculateDistanceMeters, formatDistance } from '@/utils/geo';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

import { Navigation } from 'lucide-react';

interface CultureItemProps {
  culture: FormattedCulture;
  isSelected?: boolean;
  currentLocation?: GeoPoint | null;
}

const CultureItem = ({ culture, isSelected = false, currentLocation = null }: CultureItemProps) => {
  const [imgSrc, setImgSrc] = useState(culture.mainImage);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImgSrc(culture.mainImage);
    setImageFailed(false);
  }, [culture.mainImage]);

  const handleImageError = () => {
    setImageFailed(true);
  };

  const hasCultureImage =
    typeof imgSrc === 'string' &&
    Boolean(imgSrc.trim()) &&
    !imageFailed &&
    !imgSrc.includes('/assets/images/logo');
  const distance = currentLocation
    ? formatDistance(calculateDistanceMeters(currentLocation, { lat: culture.lat, lng: culture.lng }))
    : null;

  return (
    <div className='flex size-full min-h-[108px] items-center gap-3.5'>
      <div className='relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] shadow-xs transition-transform duration-200 group-hover:scale-[1.02]'>
        {hasCultureImage ? (
          <Image
            src={imgSrc}
            alt={culture.title}
            loading='lazy'
            onError={handleImageError}
            fill
            sizes='80px'
            className='object-cover'
          />
        ) : (
          <CultureImageFallback compact classification={culture.classification} />
        )}
      </div>
      <div className='min-w-0 flex-1 overflow-hidden py-0.5'>
        <div className='mb-1.5 flex items-center gap-2'>
          <CultureCategoryBadge classification={culture.classification} className='shrink-0' />
          <span className='truncate text-[0.74rem] font-medium text-[var(--color-text-secondary)]'>
            {culture.guName || '전국'}
          </span>
          {isSelected && (
            <span className='ml-auto size-2 shrink-0 rounded-full bg-[var(--color-brand-primary)]' aria-hidden='true' />
          )}
        </div>
        <p
          className='text-[0.97rem] font-bold leading-snug tracking-tight text-[var(--color-text-primary)]'
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {culture.title}
        </p>
        <div className='mt-1.5 flex flex-col gap-0.5 text-xs text-[var(--color-text-tertiary)]'>
          <span className='truncate'>{culture.displayDate}</span>
          <div className='flex items-center justify-between gap-1'>
            <span className='truncate text-[var(--color-text-secondary)]'>{culture.displayPlace}</span>
            <div className='flex items-center gap-1 shrink-0'>
              {distance && (
                <span className='inline-flex items-center gap-0.5 rounded-sm bg-[var(--color-brand-subtle)] px-1.5 py-0.5 text-[0.7rem] font-semibold text-[var(--color-brand-primary)]'>
                  <Navigation className='size-2.5 fill-current' />
                  {distance}
                </span>
              )}
              {culture.displayPrice && (
                <span className='text-[0.72rem] font-medium text-[var(--color-text-secondary)]'>
                  {culture.displayPrice}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CultureItem);
