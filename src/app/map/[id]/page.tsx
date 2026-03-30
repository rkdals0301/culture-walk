'use client';

import Button from '@/components/Common/Button';
import Loader from '@/components/Loader/Loader';
import { useBottomSheet } from '@/context/BottomSheetContext';
import { useCultureById } from '@/hooks/cultureHooks';
import { getCulture } from '@/selectors/cultureSelectors';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

const MapDetailPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const cultureId = useMemo(() => {
    const rawId = params?.id;
    const idValue = Array.isArray(rawId) ? rawId[0] : rawId;
    return idValue ? parseInt(idValue, 10) : NaN;
  }, [params]);

  const { isLoading, error } = useCultureById(cultureId);
  const culture = useSelector(getCulture);
  const { openBottomSheet } = useBottomSheet();

  const [imgSrc, setImgSrc] = useState<string | undefined>(culture?.mainImage);

  const handleImageError = useCallback(() => {
    setImgSrc('/assets/images/logo.svg');
  }, []);

  const handleOpenExternalLink = useCallback((url?: string) => {
    if (url) window.open(url, '_blank');
  }, []);

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
      return (
        <div className='surface-card flex flex-col items-center justify-center gap-4 rounded-[28px] p-6 text-center'>
          <p className='text-lg font-semibold tracking-[-0.03em]'>행사 정보를 찾을 수 없습니다.</p>
          <Button ariaLabel='목록으로 돌아가기' onClick={() => router.push('/map')}>
            목록으로 돌아가기
          </Button>
        </div>
      );
    }

    return (
      <div className='flex flex-col gap-5'>
        <div className='relative aspect-[16/10] overflow-hidden rounded-[28px] bg-black/[0.04] dark:bg-white/[0.05]'>
          <Image
            src={imgSrc ?? '/assets/images/logo.svg'}
            alt={culture.title}
            placeholder='blur'
            blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNcWQ8AAdcBKrJda2oAAAAASUVORK5CYII='
            onError={handleImageError}
            fill
            sizes='100dvw'
            priority
            className='object-cover'
          />
        </div>
        <div className='flex flex-wrap gap-2'>
          <span className='rounded-full bg-[#e3f1ec] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#1f765f] dark:bg-[#12382f] dark:text-[#8dc5b5]'>
            {culture.classification || 'Culture'}
          </span>
          <span className='soft-chip rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-muted)]'>{culture.guName}</span>
          <span className='soft-chip rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-muted)]'>
            {culture.displayPrice}
          </span>
        </div>
        <div>
          <p className='text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#1f765f] dark:text-[#8dc5b5]'>Selected Event</p>
          <h2 className='mt-2 text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.05em]'>{culture.title}</h2>
        </div>
        <div className='space-y-2 text-sm leading-6 text-[var(--app-muted)]'>
          <p>{culture.displayPlace}</p>
          <p>{culture.displayDate}</p>
          <p>{culture.useTarget}</p>
          <p>{culture.displayPrice}</p>
        </div>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          <Button
            fullWidth
            ariaLabel='서울문화포털 웹사이트로 이동'
            onClick={() => handleOpenExternalLink(culture?.homepageAddress)}
            variant='secondary'
            disabled={!culture?.homepageAddress}
          >
            서울문화포털
          </Button>
          <Button
            fullWidth
            ariaLabel='예약 웹사이트로 이동'
            onClick={() => handleOpenExternalLink(culture?.homepageDetailAddress)}
            disabled={!culture?.homepageDetailAddress}
          >
            예약 / 상세
          </Button>
        </div>
      </div>
    );
  }, [isLoading, error, culture, imgSrc, handleImageError, handleOpenExternalLink, router]);

  // BottomSheet 여는 로직 통합
  useEffect(() => {
    // if (!isLoading && !error && culture) {
    openBottomSheet({
      content: renderContent(),
      onClose: handleBottomSheetClose,
    });
    // }
    // }, [isLoading, error, culture, renderContent, openBottomSheet, handleBottomSheetClose]);
  }, [renderContent, openBottomSheet, handleBottomSheetClose]);

  return null;
};

export default MapDetailPage;
