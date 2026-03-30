import { FormattedCulture } from '@/types/culture';

import React, { useEffect, useState } from 'react';

import { useTheme } from 'next-themes';
import Image from 'next/image';

interface CultureItemProps {
  culture: FormattedCulture;
}

const CultureItem = ({ culture }: CultureItemProps) => {
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
    <li className='flex size-full items-center gap-4'>
      <div className='relative h-24 w-20 flex-none overflow-hidden rounded-[22px] bg-black/[0.04] dark:bg-white/[0.05] sm:h-28 sm:w-24'>
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
        <div className='mb-3 flex flex-wrap items-center gap-2'>
          <span className='rounded-full bg-[#e3f1ec] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#1f765f] dark:bg-[#12382f] dark:text-[#8dc5b5]'>
            {culture.classification || 'Culture'}
          </span>
          <span className='rounded-full bg-black/[0.04] px-2.5 py-1 text-[0.68rem] font-medium text-[var(--app-muted)] dark:bg-white/[0.06]'>
            {culture.guName}
          </span>
        </div>
        <p
          className='text-sm font-semibold leading-6 tracking-[-0.02em] sm:text-base'
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {culture.title}
        </p>
        <div className='mt-3 space-y-1.5 text-xs font-medium text-[var(--app-muted)] sm:text-sm'>
          <p className='truncate'>{culture.displayPlace}</p>
          <p className='truncate'>{culture.displayDate}</p>
          <p className='truncate'>{culture.displayPrice}</p>
        </div>
      </div>
    </li>
  );
};

export default React.memo(CultureItem);
