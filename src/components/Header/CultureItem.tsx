import { FormattedCulture } from '@/types/culture';

import React, { useState } from 'react';

import Image from 'next/image';

interface CultureItemProps {
  culture: FormattedCulture;
  onClick: () => void;
}

const CultureItem = ({ culture, onClick }: CultureItemProps) => {
  const [imgSrc, setImgSrc] = useState(culture.mainImage);

  const handleImageError = () => {
    setImgSrc('/assets/logo.svg');
  };

  return (
    <li className='flex size-full gap-4' onClick={onClick}>
      <div className='size-16 flex-none'>
        <Image
          width={64}
          height={64}
          src={imgSrc}
          alt={culture.title}
          className='size-full rounded-md'
          loading='lazy'
          onError={handleImageError}
        />
      </div>
      <div className='size-full grow overflow-hidden'>
        <p className='mb-1 truncate text-sm font-bold text-gray-900 dark:text-gray-100'>{culture.title}</p>
        <p className='truncate text-xs font-medium text-gray-600 dark:text-gray-400'>{culture.displayPlace}</p>
        {/* <p className='truncate text-xs font-medium text-gray-600 dark:text-gray-400'>{culture.displayDate}</p> */}
        {/* <p className='truncate text-xs font-medium text-gray-600 dark:text-gray-400'>{culture.useTarget}</p> */}
        <p className='truncate text-xs font-medium text-gray-600 dark:text-gray-400'>{culture.displayPrice}</p>
      </div>
    </li>
  );
};

export default React.memo(CultureItem);
