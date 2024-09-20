import React, { useState } from 'react';
import { FormattedCulture } from '@/types/culture';
import Image from 'next/image';
import styles from './CultureItem.module.scss';

interface CultureItemProps {
  culture: FormattedCulture;
  onClick?: () => void;
}

const CultureItem = ({ culture, onClick }: CultureItemProps) => {
  const [imgSrc, setImgSrc] = useState(culture.mainImage);

  const handleImageError = () => {
    setImgSrc('/assets/logo.svg');
  };

  return (
    <li className={styles['culture-item-wrapper']} onClick={onClick}>
      <div className={styles['content-wrapper']}>
        <p className={styles['content-title']}>{culture.title}</p>
        <p className={styles['content-place']}>{culture.displayPlace}</p>
        <p className={styles['content-date']}>{culture.displayDate}</p>
        <p className={styles['content-target']}>{culture.useTarget}</p>
        <p className={styles['content-price']}>{culture.displayPrice}</p>
      </div>
      <div className={styles['image-wrapper']}>
        <Image
          src={imgSrc}
          width={100}
          height={100}
          className={styles['image']}
          alt='Culture Image'
          blurDataURL={culture.mainImage}
          onError={handleImageError}
        />
      </div>
    </li>
  );
};

export default CultureItem;
