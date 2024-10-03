import React, { useState, useEffect } from 'react';
import { FormattedCulture } from '@/types/culture';
import Image from 'next/image';

interface CultureItemProps {
  culture: FormattedCulture;
  onClick?: () => void;
}

const CultureItem = ({ culture, onClick }: CultureItemProps) => {
  const [imgSrc, setImgSrc] = useState(culture.mainImage);

  const handleImageError = () => {
    setImgSrc('/assets/logo.svg');
  };

  useEffect(() => {
    setImgSrc(culture.mainImage);
  }, [culture.mainImage]);

  return (
    <li className='flex h-full gap-4' onClick={onClick ? onClick : undefined}>
      <div className='flex size-24 flex-none'>
        <Image
          src={imgSrc}
          width={96}
          height={96}
          className={'size-24 rounded-md'}
          alt='Culture Image'
          onError={handleImageError}
          loading='lazy'
        />
      </div>
      <div className='grow overflow-hidden'>
        <p className='truncate text-sm font-bold text-gray-900 dark:text-gray-100'>{culture.title}</p>
        <p className='truncate text-xs text-gray-600 dark:text-gray-400'>{culture.displayPlace}</p>
        <p className='truncate text-xs text-gray-600 dark:text-gray-400'>{culture.displayDate}</p>
        <p className='truncate text-xs text-gray-600 dark:text-gray-400'>{culture.useTarget}</p>
        <p className='truncate text-xs text-gray-600 dark:text-gray-400'>{culture.displayPrice}</p>
      </div>
    </li>
  );
};

export default React.memo(CultureItem);
