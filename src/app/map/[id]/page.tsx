'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useCultureById } from '@/hooks/cultureHooks';
import Loader from '@/components/Loader/Loader';
import clsx from 'clsx'; // clsx 추가
import styles from './page.module.scss';
import { CultureItem } from '@/components/CultureList';
import { useBottomSheet } from '@/context/BottomSheetContext';
import { getCulture } from '@/selectors/cultureSelectors'; // 선택자 임포트

interface MapDetailProps {
  params: {
    id: string;
  };
}

const MapDetail = ({ params }: MapDetailProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timestamp = searchParams.get('timestamp'); // timestamp 값을 추출
  const cultureId = parseInt(params.id, 10); // 문자열을 숫자로 변환
  const { isLoading, error } = useCultureById(cultureId);
  const culture = useSelector(getCulture); // Reselect을 사용하여 culture 가져오기
  const { openBottomSheet } = useBottomSheet();

  const handleOpenExternalLink = (url: string | undefined) => {
    window.open(url, '_blank');
  };

  const handleBottomSheetClose = useCallback(() => {
    router.push('/map', { scroll: false }); // 바텀 시트 닫기 시, URL만 변경하고 상태는 유지
  }, [router]);

  useEffect(() => {
    let content: JSX.Element | null = null;

    if (isLoading) {
      content = <Loader />;
    } else if (error) {
      content = <div>Error: {error.message}</div>;
    } else if (culture) {
      content = (
        <div className={styles['bottom-sheet-container']}>
          <div className={styles['culture-item-container']}>
            <CultureItem culture={culture} variant='bottomsheet' />
          </div>
          <div className={styles['button-wrapper']}>
            <button
              type='button'
              className={clsx('button', 'button-primary', styles['button-link'])}
              onClick={() => handleOpenExternalLink(culture?.homepageAddress)}
            >
              서울문화포털
            </button>
            <button
              type='button'
              className={clsx('button', 'button-primary', styles['button-link'])}
              onClick={() => handleOpenExternalLink(culture?.homepageDetailAddress)}
            >
              예약
            </button>
          </div>
        </div>
      );
    }

    openBottomSheet({
      content,
      onClose: handleBottomSheetClose,
    });
  }, [isLoading, error, culture, handleBottomSheetClose, openBottomSheet, params.id, timestamp]);

  return null;
};

export default MapDetail;
