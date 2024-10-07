import { FormattedCulture } from '@/types/culture';

import React, { useEffect, useState } from 'react';

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
    <div className='flex h-full flex-col gap-2'>
      <div className='grow'>
        <li className='flex size-full gap-4' onClick={onClick ? onClick : undefined}>
          <div className='size-16 flex-none'>
            <Image
              src={imgSrc}
              width={64}
              height={64}
              className={'size-full rounded-md object-cover'}
              alt={culture.title}
              onError={handleImageError}
              loading='lazy'
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
      </div>
      <div className='flex h-11 flex-none gap-2'>
        <Button
          fullWidth
          ariaLabel='서울문화포털 웹사이트로 이동'
          onClick={() => handleOpenExternalLink(culture?.homepageAddress)}
        >
          서울문화포털
        </Button>
        <Button
          fullWidth
          ariaLabel='예약 웹사이트로 이동'
          onClick={() => handleOpenExternalLink(culture?.homepageDetailAddress)}
        >
          예약
        </Button>
      </div>
    </div>
  );
};

export default React.memo(CultureItem);
