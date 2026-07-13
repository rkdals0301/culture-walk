import CultureCategoryBadge from '@/components/Common/CultureCategoryBadge';
import CultureImageFallback from '@/components/Common/CultureImageFallback';
import { FormattedCulture } from '@/types/culture';
import { calculateDistanceMeters, formatDistance, GeoPoint } from '@/utils/geo';

import React, { useEffect, useState } from 'react';

import { useTheme } from 'next-themes';
import Image from 'next/image';

interface CultureItemProps {
  culture: FormattedCulture;
  isSelected?: boolean;
  currentLocation?: GeoPoint | null;
}

const CultureItem = ({ culture, isSelected = false, currentLocation = null }: CultureItemProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [imgSrc, setImgSrc] = useState(culture.mainImage);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className='relative h-24 w-[72px] flex-none overflow-hidden rounded-xl bg-black/[0.04] dark:bg-white/[0.05]'>
        {hasCultureImage ? (
          <Image
            src={imgSrc}
            alt={culture.title}
            loading='lazy'
            placeholder='blur'
            blurDataURL={
              mounted && resolvedTheme === 'dark'
                ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAPUlEQVR42u3OMQEAAAgDIJfE/ik1xh5IQPamKgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLtwAPpqkfBnntZwAAAAABJRU5ErkJggg=='
                : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAPUlEQVR42u3OMQEAAAgDINe/pE00xh5IQPamKgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLtwAMX43gB4UCRUgAAAABJRU5ErkJggg=='
            }
            onError={handleImageError}
            fill
            sizes='72px'
            className='object-cover'
          />
        ) : (
          <CultureImageFallback compact />
        )}
      </div>
      <div className='min-w-0 grow overflow-hidden'>
        <div className='mb-1.5 flex items-center gap-2'>
          <CultureCategoryBadge classification={culture.classification} />
          <span className='truncate text-[0.72rem] font-medium text-[var(--app-muted)]'>
            {culture.guName}
          </span>
          {isSelected && <span className='ml-auto size-2 shrink-0 rounded-full bg-[#d98b2f]' aria-hidden='true' />}
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
        <div className='mt-1.5 space-y-1 text-[0.78rem] font-medium leading-[1.35] text-[var(--app-muted)]'>
          <p className='truncate'>{culture.displayPlace}</p>
          <div className='flex min-w-0 items-center gap-2'>
            <p className='min-w-0 flex-1 truncate'>{culture.displayDate}</p>
            {distance && <span className='shrink-0 font-semibold text-[#c47722] dark:text-[#e2a35d]'>{distance}</span>}
            <span className='shrink-0 text-[0.72rem]'>{culture.displayPrice}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CultureItem);
