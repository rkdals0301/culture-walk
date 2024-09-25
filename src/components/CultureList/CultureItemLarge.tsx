import React, { useState, useEffect } from 'react';
import { FormattedCulture } from '@/types/culture';
import Image from 'next/image';
import styles from './CultureItemLarge.module.scss';

interface CultureItemLargeProps {
  culture: FormattedCulture;
  onClick?: () => void;
}

const CultureItemLarge = ({ culture, onClick }: CultureItemLargeProps) => {
  const [imgSrc, setImgSrc] = useState(culture.mainImage);

  const handleImageError = () => {
    setImgSrc('/assets/logo.svg');
  };

  // 이미지 소스가 변경될 때마다 캐시 방지
  useEffect(() => {
    setImgSrc(culture.mainImage);
  }, [culture.mainImage]);

  return (
    <li className={styles['culture-item-wrapper']} onClick={onClick}>
      <div className={styles['image-wrapper']}>
        <Image
          src={imgSrc}
          fill
          className={styles['image']}
          alt='Culture Image'
          blurDataURL={culture.mainImage}
          onError={handleImageError}
        />
      </div>
      <div className={styles['content-wrapper']}>
        <p className={styles['content-title']}>{culture.title}</p>
        <p className={styles['content-place']}>{culture.displayPlace}</p>
        <p className={styles['content-date']}>{culture.displayDate}</p>
        <p className={styles['content-target']}>{culture.useTarget}</p>
        <p className={styles['content-price']}>{culture.displayPrice}</p>
      </div>
    </li>
  );
};

export default CultureItemLarge;
