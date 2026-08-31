import CultureCategoryBadge from '@/components/Common/CultureCategoryBadge';
import CultureImageFallback from '@/components/Common/CultureImageFallback';
import { FormattedCulture } from '@/types/culture';
import { GeoPoint, calculateDistanceMeters, formatDistance } from '@/utils/geo';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

import { CalendarDays, MapPin } from 'lucide-react';

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

  const hasCultureImage = Boolean(imgSrc) && !imageFailed && !imgSrc.includes('/assets/images/logo');
  const distance = currentLocation
    ? formatDistance(calculateDistanceMeters(currentLocation, { lat: culture.lat, lng: culture.lng }))
    : null;

  return (
    <div className='flex size-full min-h-[104px] items-center gap-3'>
      <div className='relative h-24 w-20 flex-none overflow-hidden rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)]'>
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
      <div className='min-w-0 grow overflow-hidden'>
        <div className='mb-1.5 flex items-center gap-2'>
          <CultureCategoryBadge classification={culture.classification} className='shrink-0' />
          <span className='truncate text-[0.72rem] font-medium text-[var(--color-text-secondary)]'>
            {culture.guName || '전국'}
          </span>
          {isSelected && (
            <span className='ml-auto size-2 shrink-0 rounded-full bg-[var(--color-accent-primary)]' aria-hidden='true' />
          )}
        </div>
        <p
          className='text-[0.96rem] font-semibold leading-[1.35]'
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {culture.title}
        </p>
        <div className='mt-2 space-y-1 text-[0.76rem] font-medium leading-[1.35] text-[var(--color-text-secondary)]'>
          <div className='flex min-w-0 items-center gap-1.5'>
            <CalendarDays aria-hidden='true' className='size-3.5 shrink-0 text-[var(--color-brand-primary)]' strokeWidth={1.8} />
            <span className='min-w-0 truncate'>{culture.displayDate}</span>
          </div>
          <div className='flex min-w-0 items-center gap-1.5'>
            <MapPin aria-hidden='true' className='size-3.5 shrink-0 text-[var(--color-brand-primary)]' strokeWidth={1.8} />
            <span className='min-w-0 flex-1 truncate'>{culture.displayPlace}</span>
            {distance && <span className='shrink-0 font-semibold text-[var(--color-accent-text)]'>{distance}</span>}
            <span className='max-w-[5.5rem] shrink-0 truncate text-[0.72rem]'>{culture.displayPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CultureItem);
