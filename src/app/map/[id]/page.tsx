'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useCultureById } from '@/hooks/cultureHooks';
import Loader from '@/components/Loader/Loader';
import styles from './page.module.scss';
import { CultureItem } from '@/components/CultureList';
import { useBottomSheet } from '@/context/BottomSheetContext';

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
  const { openBottomSheet } = useBottomSheet();

  const handleOpenExternalLink = (url: string | undefined) => {
    window.open(url, '_blank');
  };

  const handleBottomSheetClose = useCallback(() => {
    router.push('/map', { scroll: false }); // 바텀 시트 닫기 시, URL만 변경하고 상태는 유지
  }, [router]);

  useEffect(() => {
    if (isLoading) {
      openBottomSheet({
        content: <Loader />,
        onClose: handleBottomSheetClose,
      });
    } else if (error) {
      openBottomSheet({
        content: <div>Error: {error.message}</div>,
        onClose: handleBottomSheetClose,
      });
    } else if (culture) {
      openBottomSheet({
        content: (
          <div className={styles['bottom-sheet-container']}>
            <CultureItem culture={culture} />
            <div className={styles['button-wrapper']}>
              <button
                type='button'
                className={`button button-primary ${styles['button-link']}`}
                onClick={() => handleOpenExternalLink(culture?.homepageAddress)}
              >
                서울문화포털
              </button>
              <button
                type='button'
                className={`button button-primary ${styles['button-link']}`}
                onClick={() => handleOpenExternalLink(culture?.homepageDetailAddress)}
              >
                예약
              </button>
            </div>
          </div>
        ),
        onClose: handleBottomSheetClose,
      });
    }
  }, [isLoading, error, culture, openBottomSheet, handleBottomSheetClose]);

  return null; // 바텀 시트가 열릴 때는 MapDetail 컴포넌트가 UI를 렌더링하지 않음
};

export default MapDetail;
