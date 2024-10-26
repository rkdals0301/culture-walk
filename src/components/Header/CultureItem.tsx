import { FormattedCulture } from '@/types/culture';

import React, { useState } from 'react';

import { useTheme } from 'next-themes';
import Image from 'next/image';

interface CultureItemProps {
  culture: FormattedCulture;
}

const CultureItem = ({ culture }: CultureItemProps) => {
  const { resolvedTheme } = useTheme();
  const [imgSrc, setImgSrc] = useState(culture.mainImage);

  const handleImageError = () => {
    setImgSrc('/assets/images/logo.svg');
  };

  return (
    <li className='flex size-full gap-4'>
      <div className='relative size-16 flex-none'>
        <Image
          src={imgSrc}
          alt={culture.title}
          loading='lazy'
          placeholder='blur'
          blurDataURL={
            resolvedTheme === 'dark'
              ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAPUlEQVR42u3OMQEAAAgDIJfE/ik1xh5IQPamKgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLtwAPpqkfBnntZwAAAAABJRU5ErkJggg=='
              : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAPUlEQVR42u3OMQEAAAgDINe/pE00xh5IQPamKgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLtwAMX43gB4UCRUgAAAABJRU5ErkJggg=='
          }
          onError={handleImageError}
          fill
          sizes='100dvw'
          className='rounded-lg'
        />
      </div>
      <div className='size-full grow overflow-hidden'>
        <p className='truncate text-sm font-semibold text-gray-900 dark:text-gray-100'>{culture.title}</p>
        <p className='truncate text-sm font-medium text-gray-600 dark:text-gray-400'>{culture.displayPlace}</p>
        {/* <p className='truncate text-sm font-medium text-gray-600 dark:text-gray-400'>{culture.displayDate}</p> */}
        {/* <p className='truncate text-sm font-medium text-gray-600 dark:text-gray-400'>{culture.useTarget}</p> */}
        <p className='truncate text-sm font-medium text-gray-600 dark:text-gray-400'>{culture.displayPrice}</p>
      </div>
    </li>
  );
};

export default React.memo(CultureItem);
