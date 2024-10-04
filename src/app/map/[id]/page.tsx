'use client';

import Button from '@/components/Common/Button';
import { CultureItem } from '@/components/CultureList';
import Loader from '@/components/Loader/Loader';
import { useBottomSheet } from '@/context/BottomSheetContext';
import { useCultureById } from '@/hooks/cultureHooks';
import { getCulture } from '@/selectors/cultureSelectors';

import { useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useRouter, useSearchParams } from 'next/navigation';

interface MapDetailProps {
  params: {
    id: string;
  };
}

const MapDetail = ({ params }: MapDetailProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const timestamp = searchParams.get('timestamp');
  const cultureId = parseInt(params.id, 10);
  const { isLoading, error } = useCultureById(cultureId);
  const culture = useSelector(getCulture);
  const { openBottomSheet } = useBottomSheet();

  const handleOpenExternalLink = (url: string | undefined) => {
    window.open(url, '_blank');
  };

  const handleBottomSheetClose = useCallback(() => {
    router.push('/map', { scroll: false });
  }, [router]);

  useEffect(() => {
    let content: JSX.Element | null = null;

    if (isLoading) {
      content = <Loader />;
    } else if (error) {
      content = <div>Error: {error.message}</div>;
    } else if (culture) {
      content = (
        <div className='flex h-full flex-col gap-2'>
          <div className='grow'>
            <CultureItem culture={culture} />
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
    }

    openBottomSheet({
      content,
      onClose: handleBottomSheetClose,
    });
  }, [isLoading, error, culture, handleBottomSheetClose, openBottomSheet, params.id, timestamp]);

  return null;
};

export default MapDetail;
