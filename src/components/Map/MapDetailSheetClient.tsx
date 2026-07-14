'use client';

import GoogleAdSlot from '@/components/Ads/GoogleAdSlot';
import Button from '@/components/Common/Button';
import CultureCategoryBadge from '@/components/Common/CultureCategoryBadge';
import CultureImageFallback from '@/components/Common/CultureImageFallback';
import Loader from '@/components/Loader/Loader';
import { useBottomSheet } from '@/context/BottomSheetContext';
import { useCultureContext } from '@/context/CultureContext';
import { useCultureById } from '@/hooks/cultureHooks';
import type { FormattedCulture } from '@/types/culture';

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
  const [imageFailed, setImageFailed] = useState(false);

  const handleImageError = useCallback(() => {
    setImageFailed(true);
  }, []);

  const handleOpenExternalLink = useCallback((url?: string) => {
    if (url) window.open(url, '_blank');
  }, []);

  const handleBottomSheetClose = useCallback(() => {
    router.push('/map');
  }, [router]);

  useEffect(() => {
    setImgSrc(culture?.mainImage);
    setImageFailed(false);
  }, [culture?.mainImage]);

  const renderFooter = useCallback(() => {
    if (!culture) {
      return null;
    }

    return (
      <div className='grid grid-cols-2 gap-2.5'>
        <Button
          fullWidth
          ariaLabel='서울문화포털 웹사이트로 이동'
          onClick={() => handleOpenExternalLink(culture.homepageAddress)}
          variant='secondary'
          disabled={!culture.homepageAddress}
        >
          <span>문화포털</span>
          <span className='ml-1.5 text-base' aria-hidden='true'>
            ↗
          </span>
        </Button>
        <Button
          fullWidth
          ariaLabel='예약 / 상세 웹사이트로 이동'
          onClick={() => handleOpenExternalLink(culture.homepageDetailAddress)}
          disabled={!culture.homepageDetailAddress}
        >
          <span>예약 / 상세</span>
          <span className='ml-1.5 text-base' aria-hidden='true'>
            ↗
          </span>
        </Button>
      </div>
    );
  }, [culture, handleOpenExternalLink]);

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

    const hasCultureImage = Boolean(imgSrc) && !imageFailed && !imgSrc?.includes('/assets/images/logo');

    return (
      <div className='flex flex-col gap-4'>
        <div className='relative aspect-[4/3] overflow-hidden rounded-[18px] bg-black/[0.04] dark:bg-white/[0.05]'>
          {hasCultureImage ? (
            <Image
              src={imgSrc as string}
              alt={culture.title}
              placeholder='blur'
              blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNcWQ8AAdcBKrJda2oAAAAASUVORK5CYII='
              onError={handleImageError}
              fill
              sizes='(min-width: 1024px) 520px, 100dvw'
              priority
              className='object-contain'
            />
          ) : (
            <CultureImageFallback classification={culture.classification || '문화행사'} />
          )}
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <CultureCategoryBadge classification={culture.classification} className='px-3 py-1.5' />
          {culture.guName && (
            <span className='soft-chip rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-muted)]'>
              {culture.guName}
            </span>
          )}
          <span className='soft-chip rounded-full px-3 py-1.5 text-sm font-medium text-[var(--app-muted)]'>
            {culture.displayPrice}
          </span>
        </div>
        <div>
          <p className='text-[0.72rem] font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>선택한 행사</p>
          <h2 className='mt-2 text-[1.55rem] font-semibold leading-[1.2] sm:text-[1.75rem]'>{culture.title}</h2>
        </div>

        <div className='grid grid-cols-1 gap-2'>
          <div className='soft-chip rounded-[14px] px-3 py-2.5'>
            <p className='text-[0.68rem] font-semibold text-[var(--app-muted)]'>일정</p>
            <p className='mt-1 text-sm font-semibold leading-5'>{culture.displayDate}</p>
          </div>
          <div className='soft-chip rounded-[14px] px-3 py-2.5'>
            <p className='text-[0.68rem] font-semibold text-[var(--app-muted)]'>장소</p>
            <p className='mt-1 break-words text-sm font-semibold leading-5'>{culture.place || culture.guName}</p>
          </div>
          <div className='soft-chip rounded-[14px] px-3 py-2.5'>
            <p className='text-[0.68rem] font-semibold text-[var(--app-muted)]'>요금</p>
            <p className='mt-1 break-words text-sm font-semibold leading-5'>{culture.displayPrice}</p>
          </div>
        </div>

        <div className='surface-card rounded-[18px] p-4'>
          <dl className='grid gap-2 text-sm leading-6 text-[var(--app-muted)]'>
            <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
              <dt className='font-semibold text-[var(--app-text)]'>대상</dt>
              <dd className='break-words'>{culture.useTarget || '누구나'}</dd>
            </div>
            <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
              <dt className='font-semibold text-[var(--app-text)]'>주최</dt>
              <dd className='break-words'>{culture.organizationName || '정보 없음'}</dd>
            </div>
          </dl>
        </div>

        {culture.programIntroduction && (
          <div className='surface-card rounded-[18px] p-4'>
            <p className='text-[0.72rem] font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>프로그램 안내</p>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--app-muted)]'>
              {culture.programIntroduction}
            </p>
          </div>
        )}

        {culture.performerInformation && (
          <div className='surface-card rounded-[18px] p-4'>
            <p className='text-[0.72rem] font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>출연 안내</p>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--app-muted)]'>
              {culture.performerInformation}
            </p>
          </div>
        )}

        {culture.etcDescription && (
          <details className='surface-card group rounded-[18px] p-4'>
            <summary className='flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold'>
              <span className='text-[0.72rem] text-[#1f765f] dark:text-[#8dc5b5]'>추가 안내</span>
              <span className='text-xs text-[var(--app-muted)] group-open:hidden'>열기</span>
              <span className='hidden text-xs text-[var(--app-muted)] group-open:inline'>닫기</span>
            </summary>
            <p className='mt-3 whitespace-pre-line break-words text-sm leading-6 text-[var(--app-muted)]'>
              {culture.etcDescription}
            </p>
          </details>
        )}

        {ADSENSE_DETAIL_SLOT && (
          <div className='surface-card rounded-[18px] p-2.5'>
            <GoogleAdSlot slot={ADSENSE_DETAIL_SLOT} className='min-h-[88px]' />
          </div>
        )}
      </div>
    );
  }, [isLoading, error, culture, imgSrc, imageFailed, handleImageError, router]);

  useEffect(() => {
    const signature = `${cultureId}:${isLoading ? 'loading' : 'ready'}:${error?.message ?? 'no-error'}:${culture?.id ?? 'no-culture'}`;
    if (lastSheetSignatureRef.current === signature) {
      return;
    }

    lastSheetSignatureRef.current = signature;

    openBottomSheet({
      content: renderContent(),
      footer: renderFooter(),
      onClose: handleBottomSheetClose,
    });
  }, [
    culture?.id,
    cultureId,
    error?.message,
    handleBottomSheetClose,
    isLoading,
    openBottomSheet,
    renderContent,
    renderFooter,
  ]);

  return null;
};

export default MapDetailSheetClient;
