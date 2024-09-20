'use client';

// import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useCultureById } from '@/hooks/cultureHooks';
import BottomSheet from '@/components/BottomSheet/BottomSheet';
import Loader from '@/components/Loader/Loader';
import styles from './page.module.scss';
import { CultureItem } from '@/components/CultureList';

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
          {culture && <CultureItem culture={culture} />}
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
