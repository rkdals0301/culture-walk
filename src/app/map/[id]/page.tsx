'use client';

// import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useCultureById } from '@/utils/api/culture';
import BottomSheet from '@/components/Map/BottomSheet';
import Loader from '@/components/Common/Loader/Loader';
import styles from './page.module.scss';

interface MapDetailProps {
  params: {
    id: string;
  };
}

const MapDetail = ({ params }: MapDetailProps) => {
  const router = useRouter();
  const cultureId = parseInt(params.id, 10); // 문자열을 숫자로 변환
  const { isLoading, error } = useCultureById(cultureId);
  const { culture } = useSelector((state: RootState) => state.culture);

  const handleBottomSheetClose = () => {
    router.push('/map', { scroll: false }); // 바텀 시트 닫기 시, URL만 변경하고 상태는 유지
  };

  const handleOpenExternalLink = (url: string | undefined) => {
    window.open(url, '_blank');
  };

  if (isLoading)
    return (
      <BottomSheet onClose={handleBottomSheetClose}>
        <Loader />
      </BottomSheet>
    );

  if (error) {
    return <BottomSheet onClose={handleBottomSheetClose}>Error: {error.message}</BottomSheet>;
  }

  return (
    <>
      <BottomSheet onClose={handleBottomSheetClose}>
        <div className={styles['bottom-sheet-container']}>
          <div className={styles['item-wrapper']}>
            <div className={styles['content-wrapper']}>
              <p className={styles['content-title']}>{culture?.title}</p>
              <p className={styles['content-place']}>{culture?.displayPlace}</p>
              <p className={styles['content-date']}>{culture?.displayDate}</p>
              <p className={styles['content-target']}>{culture?.useTarget}</p>
              <p className={styles['content-price']}>{culture?.displayPrice}</p>
            </div>
            <div className={styles['image-wrapper']}>
              <Image
                src={culture?.mainImage || '/assets/logo.svg'}
                width={100}
                height={100}
                className={styles['image']}
                alt='Culture Image'
                blurDataURL={culture?.mainImage}
              />
            </div>
          </div>
          <div className={styles['button-wrapper']}>
            <button
              type='button'
              className={styles.button}
              onClick={() => handleOpenExternalLink(culture?.homepageAddress)}
            >
              서울문화포털
            </button>
            <button
              type='button'
              className={styles.button}
              onClick={() => handleOpenExternalLink(culture?.homepageDetailAddress)}
            >
              예약
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};

export default MapDetail;
