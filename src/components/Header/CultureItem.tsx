import { FormattedCulture } from '@/types/culture';

import React, { useState } from 'react';

import Image from 'next/image';

interface CultureItemProps {
  culture: FormattedCulture;
}

const CultureItem = ({ culture }: CultureItemProps) => {
  const [imgSrc, setImgSrc] = useState(culture.mainImage);

  const handleImageError = () => {
    setImgSrc('/assets/images/logo.svg');
  };

  return (
    <li className='flex size-full gap-4'>
      <div className='size-16 flex-none'>
        <Image
          width={64}
          height={64}
          src={imgSrc}
          alt={culture.title}
          className='size-full'
          loading='lazy'
          placeholder='blur'
          blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNcWQ8AAdcBKrJda2oAAAAASUVORK5CYII='
          onError={handleImageError}
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
