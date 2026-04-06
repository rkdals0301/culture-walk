import { FormattedCulture } from '@/types/culture';

import React, { useEffect, useState } from 'react';

import { useTheme } from 'next-themes';
import Image from 'next/image';

interface CultureItemProps {
  culture: FormattedCulture;
  isSelected?: boolean;
}

const CultureItem = ({ culture, isSelected = false }: CultureItemProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [imgSrc, setImgSrc] = useState(culture.mainImage);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageError = () => {
    setImgSrc('/assets/images/logo.svg');
  };

  return (
    <div className='flex size-full items-center gap-3 sm:gap-4'>
      <div className='relative h-24 w-20 flex-none overflow-hidden rounded-[20px] bg-black/[0.04] dark:bg-white/[0.05] sm:h-28 sm:w-24 lg:h-[7.4rem] lg:w-[6.4rem]'>
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
          sizes='100dvw'
          className='object-cover'
        />
      </div>
      <div className='min-w-0 grow overflow-hidden'>
        <div className='mb-2.5 flex flex-wrap items-center gap-2'>
          <span
            className={
              isSelected
                ? 'rounded-full bg-[#1f765f] px-2.5 py-1 text-[0.68rem] font-semibold text-[#fff8f1] dark:bg-[#2f9b7d] dark:text-[#081311]'
                : 'rounded-full bg-[#e3f1ec] px-2.5 py-1 text-[0.68rem] font-semibold text-[#1f765f] dark:bg-[#12382f] dark:text-[#8dc5b5]'
            }
          >
            {culture.classification || 'Culture'}
          </span>
          <span className='rounded-full bg-black/[0.04] px-2.5 py-1 text-[0.72rem] font-medium text-[var(--app-muted)] dark:bg-white/[0.06]'>
            {culture.guName}
          </span>
        </div>
        <p
          className='text-[1rem] font-semibold leading-[1.4] tracking-[-0.01em] sm:text-[1.02rem]'
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {culture.title}
        </p>
        <div className='mt-2.5 space-y-1.5 text-[0.84rem] font-medium leading-[1.35] text-[var(--app-muted)] sm:text-sm'>
          <p
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {culture.displayPlace}
          </p>
          <p className='truncate'>{culture.displayDate}</p>
          <p className='truncate'>{culture.displayPrice}</p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CultureItem);
