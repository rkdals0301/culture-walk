import CultureCategoryBadge from '@/components/Common/CultureCategoryBadge';
import CultureImageFallback from '@/components/Common/CultureImageFallback';
import { FormattedCulture } from '@/types/culture';
import { GeoPoint, calculateDistanceMeters, formatDistance } from '@/utils/geo';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

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
      <div className='relative h-24 w-[72px] flex-none overflow-hidden rounded-lg bg-[var(--color-surface-chip)]'>
        {hasCultureImage ? (
          <Image
            src={imgSrc}
            alt={culture.title}
            loading='lazy'
            onError={handleImageError}
            fill
            sizes='72px'
            className='object-cover'
          />
        ) : (
          <CultureImageFallback compact classification={culture.classification} />
        )}
      </div>
      <div className='min-w-0 grow overflow-hidden'>
        <div className='mb-1.5 flex items-center gap-2'>
          <CultureCategoryBadge classification={culture.classification} />
          <span className='truncate text-[0.72rem] font-medium text-[var(--color-text-secondary)]'>{culture.guName}</span>
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
        <div className='mt-1.5 space-y-1 text-[0.78rem] font-medium leading-[1.35] text-[var(--color-text-secondary)]'>
          <p className='truncate'>{culture.displayPlace}</p>
          <div className='flex min-w-0 items-center gap-2'>
            <p className='min-w-0 flex-1 truncate'>{culture.displayDate}</p>
            {distance && <span className='shrink-0 font-semibold text-[var(--color-accent-text)]'>{distance}</span>}
            <span className='shrink-0 text-[0.72rem]'>{culture.displayPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CultureItem);
