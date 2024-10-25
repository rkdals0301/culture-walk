'use client';

import Button from '@/components/Common/Button';
import Loader from '@/components/Loader/Loader';
import { useBottomSheet } from '@/context/BottomSheetContext';
import { useCultureById } from '@/hooks/cultureHooks';
import { getCulture } from '@/selectors/cultureSelectors';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import Image from 'next/image';
import { notFound, useRouter } from 'next/navigation';

interface MapDetailPageProps {
  params: {
    id: string;
  };
}

const MapDetailPage = ({ params }: MapDetailPageProps) => {
  const router = useRouter();
  const cultureId = useMemo(() => parseInt(params.id, 10), [params.id]);

  const { isLoading, error } = useCultureById(cultureId);
  const culture = useSelector(getCulture);
  const { openBottomSheet } = useBottomSheet();

  const [imgSrc, setImgSrc] = useState<string | undefined>(culture?.mainImage);

  const handleImageError = () => {
    setImgSrc('/assets/images/logo.svg');
  };

  const handleOpenExternalLink = (url?: string) => {
    if (url) window.open(url, '_blank');
  };

  const handleBottomSheetClose = useCallback(() => {
    router.push('/map');
  }, [router]);

  useEffect(() => {
    setImgSrc(culture?.mainImage || '/assets/images/logo.svg');
  }, [culture?.mainImage]);

  // Content 렌더링 로직 분리
  const renderContent = useCallback(() => {
    if (isLoading) {
      return <Loader />;
    }
    if (error) {
      return (
        <div className='flex size-full flex-col items-center justify-center gap-4'>
          <p>죄송합니다, 데이터를 불러오는 중에 문제가 발생했습니다.</p>
          <Button ariaLabel='다시 시도' onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </div>
      );
    }
    if (!culture) {
      notFound();
    }

    return (
      <div className='flex size-full flex-col gap-4'>
        <div className='flex h-[calc(100%-3.5rem)] grow gap-4'>
          <div className='h-full w-32 flex-none'>
            <Image
              width={128}
              height={182}
              src={imgSrc ?? '/assets/images/logo.svg'}
              alt={culture.title}
              className='size-full rounded-lg'
              placeholder='blur'
              blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNcWQ8AAdcBKrJda2oAAAAASUVORK5CYII='
              onError={handleImageError}
              priority
            />
          </div>
          <div className='h-full grow overflow-y-auto'>
            <p className='font-semibold text-gray-900 dark:text-gray-100'>{culture.title}</p>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>{culture.displayPlace}</p>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>{culture.displayDate}</p>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>{culture.useTarget}</p>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-400'>{culture.displayPrice}</p>
          </div>
        </div>
        <div className='flex h-10 flex-none gap-4'>
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
  }, [isLoading, error, culture, imgSrc]);

  // BottomSheet 여는 로직 통합
  useEffect(() => {
    openBottomSheet({
      content: renderContent(),
      onClose: handleBottomSheetClose,
    });
  }, [renderContent, openBottomSheet, handleBottomSheetClose]);

  return null;
};

export default MapDetailPage;
