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
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import ArrowBackIcon from '../../../public/assets/images/arrow-back-icon.svg';

const ADSENSE_DETAIL_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL_PANEL;

interface MapDetailSheetClientProps {
  initialCulture: FormattedCulture;
}

interface MapDetailFallbackProps {
  culture: FormattedCulture;
}

const MapDetailFallback = ({ culture }: MapDetailFallbackProps) => {
  const hasExternalLinks = Boolean(culture.homepageAddress || culture.homepageDetailAddress);

  return (
    <article className='surface-panel pointer-events-auto fixed inset-x-3 bottom-3 z-50 flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-[24px] text-[var(--app-text)] md:bottom-6 md:left-auto md:right-6 md:max-h-[calc(100dvh-8rem)] md:w-[420px] lg:bottom-0 lg:left-0 lg:right-auto lg:top-[72px] lg:h-[calc(100dvh-72px)] lg:max-h-none lg:w-[400px] lg:rounded-none lg:border-b-0 lg:border-l-0 lg:border-t-0 lg:shadow-none'>
      <header className='border-b border-[var(--app-border)] px-5 pb-5 pt-4'>
        <Link
          href='/map'
          className='mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--app-muted)] hover:text-[var(--app-text)]'
        >
          <ArrowBackIcon className='size-4' />
          지도 목록
        </Link>
        <p className='text-[0.72rem] font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>
          {culture.classification || '문화행사'}
        </p>
        <h1 className='mt-2 text-[1.55rem] font-semibold leading-[1.25] sm:text-[1.75rem]'>{culture.title}</h1>
      </header>

      <div className='min-h-0 flex-1 overflow-y-auto px-5 py-5'>
        <dl className='grid gap-4 text-sm leading-6'>
          <div>
            <dt className='text-[0.7rem] font-semibold text-[var(--app-muted)]'>일정</dt>
            <dd className='mt-1 font-semibold'>{culture.displayDate}</dd>
          </div>
          <div>
            <dt className='text-[0.7rem] font-semibold text-[var(--app-muted)]'>장소</dt>
            <dd className='mt-1 font-semibold'>{culture.place || culture.guName}</dd>
          </div>
          <div>
            <dt className='text-[0.7rem] font-semibold text-[var(--app-muted)]'>요금</dt>
            <dd className='mt-1 font-semibold'>{culture.displayPrice}</dd>
          </div>
          <div>
            <dt className='text-[0.7rem] font-semibold text-[var(--app-muted)]'>대상</dt>
            <dd className='mt-1'>{culture.useTarget || '누구나'}</dd>
          </div>
          <div>
            <dt className='text-[0.7rem] font-semibold text-[var(--app-muted)]'>주최</dt>
            <dd className='mt-1'>{culture.organizationName || '정보 없음'}</dd>
          </div>
        </dl>

        {culture.programIntroduction && (
          <section className='mt-6 border-t border-[var(--app-border)] pt-5'>
            <h2 className='text-sm font-semibold'>프로그램 안내</h2>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--app-muted)]'>
              {culture.programIntroduction}
            </p>
          </section>
        )}

        {hasExternalLinks && (
          <nav
            className='mt-6 grid auto-cols-fr grid-flow-col gap-2.5 border-t border-[var(--app-border)] pt-5'
            aria-label='행사 링크'
          >
            {culture.homepageAddress && (
              <a
                href={culture.homepageAddress}
                target='_blank'
                rel='noreferrer'
                className='soft-chip flex h-11 items-center justify-center rounded-xl px-3 text-sm font-semibold'
              >
                공식 홈페이지
              </a>
            )}
            {culture.homepageDetailAddress && (
              <a
                href={culture.homepageDetailAddress}
                target='_blank'
                rel='noreferrer'
                className='flex h-11 items-center justify-center rounded-xl bg-[#1f765f] px-3 text-sm font-semibold text-[#fff8f1]'
              >
                예약 / 상세
              </a>
            )}
          </nav>
        )}
      </div>
    </article>
  );
};

const MapDetailSheetClient = ({ initialCulture }: MapDetailSheetClientProps) => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const cultureId = useMemo(() => {
    const rawId = params?.id;
    const idValue = Array.isArray(rawId) ? rawId[0] : rawId;
    return idValue ? parseInt(idValue, 10) : NaN;
  }, [params]);

  const { isLoading, error } = useCultureById(cultureId);
  const { culture: loadedCulture } = useCultureContext();
  const culture =
    loadedCulture?.id === cultureId ? loadedCulture : initialCulture.id === cultureId ? initialCulture : null;
  const { openBottomSheet } = useBottomSheet();
  const lastSheetSignatureRef = useRef('');

  const [mounted, setMounted] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(culture?.mainImage);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          ariaLabel='행사 공식 홈페이지로 이동'
          onClick={() => handleOpenExternalLink(culture.homepageAddress)}
          variant='secondary'
          disabled={!culture.homepageAddress}
        >
          <span>공식 홈페이지</span>
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
    if (isLoading && !culture) {
      return <Loader />;
    }
    if (error && !culture) {
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

  return mounted ? null : <MapDetailFallback culture={initialCulture} />;
};

export default MapDetailSheetClient;
