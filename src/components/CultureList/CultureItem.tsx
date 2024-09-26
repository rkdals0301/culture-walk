import React, { useState, useEffect } from 'react';
import { FormattedCulture } from '@/types/culture';
import Image from 'next/image';
import styles from './CultureItem.module.scss';

interface CultureItemProps {
  culture: FormattedCulture;
  variant?: 'default' | 'bottomsheet'; // variant prop 추가
  onClick?: () => void;
}

const CultureItem = ({ culture, variant = 'default', onClick }: CultureItemProps) => {
  const [imgSrc, setImgSrc] = useState(culture.mainImage);

  const handleImageError = () => {
    setImgSrc('/assets/logo.svg');
  };

  // 이미지 소스가 변경될 때마다 캐시 방지
  useEffect(() => {
    setImgSrc(culture.mainImage);
  }, [culture.mainImage]);

  return (
    <li
      className={`${styles['culture-item-wrapper']} ${variant === 'bottomsheet' ? styles['no-hover-active'] : ''}`} // variant에 따른 클래스 적용
      onClick={onClick}
    >
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
          loading='lazy'
        />
      </div>
    </li>
  );
};

export default React.memo(CultureItem);
