'use client';

// import { useEffect } from 'react';
import BottomSheet from '@/components/Map/BottomSheet';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { loadCultureById } from '@/slices/culturesSlice';
import Loader from '@/components/Common/Loader/Loader';
import Image from 'next/image';

interface MapDetailProps {
  params: {
    id: string;
  };
}

const MapDetail = ({ params }: MapDetailProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { selectedCulture, selectedCultureLoading, error } = useSelector((state: RootState) => state.culture);
  const cultureId = parseInt(params.id, 10); // 문자열을 숫자로 변환

  useEffect(() => {
    if (!isNaN(cultureId)) {
      dispatch(loadCultureById(cultureId));
    }
  }, [cultureId, dispatch]);

  const handleBottomSheetClose = () => {
    router.push('/map', { scroll: false }); // 바텀 시트 닫기 시, URL만 변경하고 상태는 유지
  };

  const handleOpenExternalLink = (url: string | undefined) => {
    window.open(url, '_blank');
  };

  if (selectedCultureLoading)
    return (
      <BottomSheet onClose={handleBottomSheetClose}>
        <Loader />
      </BottomSheet>
    );

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <BottomSheet onClose={handleBottomSheetClose}>
        <div className={styles['bottom-sheet-container']}>
          <div className={styles['item-wrapper']}>
            <div className={styles['content-wrapper']}>
              <p className={styles['content-title']}>{selectedCulture?.title}</p>
              <p className={styles['content-place']}>{selectedCulture?.displayPlace}</p>
              <p className={styles['content-date']}>{selectedCulture?.displayDate}</p>
              <p className={styles['content-target']}>{selectedCulture?.useTarget}</p>
              <p className={styles['content-price']}>{selectedCulture?.displayPrice}</p>
            </div>
            <div className={styles['image-wrapper']}>
              <Image
                src={selectedCulture?.mainImage || 'assets/logo.svg'}
                width={100}
                height={100}
                className={styles['image']}
                alt='Culture Image'
                blurDataURL={selectedCulture?.mainImage}
              />
            </div>
          </div>
          <div className={styles['button-wrapper']}>
            <button
              type='button'
              className={styles.button}
              onClick={() => handleOpenExternalLink(selectedCulture?.homepageAddress)}
            >
              서울문화포털
            </button>
            <button
              type='button'
              className={styles.button}
              onClick={() => handleOpenExternalLink(selectedCulture?.homepageDetailAddress)}
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
