'use client';

import GoogleAdSlot from '@/components/Ads/GoogleAdSlot';
import Button from '@/components/Common/Button';
import Loader from '@/components/Loader/Loader';
import { useBottomSheet } from '@/context/BottomSheetContext';
import { useCultureContext } from '@/context/CultureContext';
import { useCultureById } from '@/hooks/cultureHooks';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

const ADSENSE_DETAIL_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL_PANEL;

const MapDetailSheetClient = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const cultureId = useMemo(() => {
    const rawId = params?.id;
    const idValue = Array.isArray(rawId) ? rawId[0] : rawId;
    return idValue ? parseInt(idValue, 10) : NaN;
  }, [params]);

  const { isLoading, error } = useCultureById(cultureId);
  const { culture } = useCultureContext();
  const { openBottomSheet } = useBottomSheet();
  const lastSheetSignatureRef = useRef('');

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
        <div className='flex flex-wrap items-center gap-2'>
          <span className='inline-flex items-center rounded-full bg-[#e3f1ec] px-3 py-1.5 text-[0.72rem] font-semibold leading-none text-[#1f765f] dark:bg-[#12382f] dark:text-[#8dc5b5]'>
            {culture.classification || 'Culture'}
          </span>
          <span className='soft-chip rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-muted)]'>{culture.guName}</span>
          <span className='soft-chip rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-muted)]'>
            {culture.displayPrice}
          </span>
        </div>
        <div>
          <p className='text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#1f765f] dark:text-[#8dc5b5]'>
            Selected Event
          </p>
          <h2 className='mt-2 text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.05em]'>{culture.title}</h2>
        </div>

        <div className='surface-card rounded-[24px] p-4'>
          <dl className='grid gap-2 text-sm leading-6 text-[var(--app-muted)]'>
            <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
              <dt className='font-semibold text-[var(--app-text)]'>장소</dt>
              <dd className='break-words'>{culture.displayPlace}</dd>
            </div>
            <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
              <dt className='font-semibold text-[var(--app-text)]'>일정</dt>
              <dd className='break-words'>{culture.displayDate}</dd>
            </div>
            <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
              <dt className='font-semibold text-[var(--app-text)]'>대상</dt>
              <dd className='break-words'>{culture.useTarget}</dd>
            </div>
            <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
              <dt className='font-semibold text-[var(--app-text)]'>요금</dt>
              <dd className='break-words'>{culture.displayPrice}</dd>
            </div>
          </dl>
        </div>

        {culture.etcDescription && (
          <div className='surface-card rounded-[24px] p-4'>
            <p className='text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#1f765f] dark:text-[#8dc5b5]'>기타 안내</p>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--app-muted)]'>
              {culture.etcDescription}
            </p>
          </div>
        )}

        {ADSENSE_DETAIL_SLOT && (
          <div className='surface-card rounded-[24px] p-2.5'>
            <GoogleAdSlot slot={ADSENSE_DETAIL_SLOT} className='min-h-[88px]' />
          </div>
        )}

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

  useEffect(() => {
    const signature = `${cultureId}:${isLoading ? 'loading' : 'ready'}:${error?.message ?? 'no-error'}:${culture?.id ?? 'no-culture'}`;
    if (lastSheetSignatureRef.current === signature) {
      return;
    }

    lastSheetSignatureRef.current = signature;

    openBottomSheet({
      content: renderContent(),
      onClose: handleBottomSheetClose,
    });
  }, [culture?.id, cultureId, error?.message, handleBottomSheetClose, isLoading, openBottomSheet, renderContent]);

  return null;
};

export default MapDetailSheetClient;
