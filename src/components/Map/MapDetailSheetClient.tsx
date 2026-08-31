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

import { CalendarDays, ExternalLink, MapPin } from 'lucide-react';

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
    <article className='bottom-sheet-panel surface-panel pointer-events-auto fixed inset-x-3 z-50 flex h-[52dvh] flex-col overflow-hidden rounded-[18px] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] md:left-auto md:right-6 md:w-[420px] lg:h-auto min-[1280px]:left-[var(--map-sidebar-width)] min-[1280px]:right-auto min-[1280px]:h-[calc(100dvh-72px)] min-[1280px]:w-[400px] min-[1280px]:rounded-none min-[1280px]:border-b-0 min-[1280px]:border-l-0 min-[1280px]:border-t-0 min-[1280px]:shadow-none'>
      <header className='border-b border-[var(--color-border-primary)] px-5 pb-5 pt-4'>
        <Link
          href='/map'
          className='mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
        >
          <ArrowBackIcon className='size-4' />
          지도 목록
        </Link>
        <p className='route-kicker'>{culture.classification || '문화행사'}</p>
        <h1 className='mt-2 text-[1.55rem] font-semibold leading-[1.25] sm:text-[1.75rem]'>{culture.title}</h1>
      </header>

      <div className='min-h-0 flex-1 overflow-y-auto px-5 py-5'>
        <dl className='grid gap-px overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-border-primary)] text-sm leading-6'>
          <div className='bg-[var(--color-surface-secondary)] p-3'>
            <dt className='text-[0.7rem] font-semibold text-[var(--color-text-secondary)]'>일정</dt>
            <dd className='mt-1 font-semibold'>{culture.displayDate}</dd>
          </div>
          <div className='bg-[var(--color-surface-secondary)] p-3'>
            <dt className='text-[0.7rem] font-semibold text-[var(--color-text-secondary)]'>장소</dt>
            <dd className='mt-1 font-semibold'>{culture.place || culture.guName}</dd>
          </div>
          <div className='bg-[var(--color-surface-secondary)] p-3'>
            <dt className='text-[0.7rem] font-semibold text-[var(--color-text-secondary)]'>요금</dt>
            <dd className='mt-1 whitespace-pre-line font-semibold'>{culture.useFee || culture.displayPrice}</dd>
          </div>
          <div className='bg-[var(--color-surface-secondary)] p-3'>
            <dt className='text-[0.7rem] font-semibold text-[var(--color-text-secondary)]'>대상</dt>
            <dd className='mt-1'>{culture.useTarget || '정보 없음'}</dd>
          </div>
          <div className='bg-[var(--color-surface-secondary)] p-3'>
            <dt className='text-[0.7rem] font-semibold text-[var(--color-text-secondary)]'>주최</dt>
            <dd className='mt-1'>{culture.organizationName || '정보 없음'}</dd>
          </div>
        </dl>

        {culture.overview && (
          <section className='mt-6 border-t border-[var(--color-border-primary)] pt-5'>
            <h2 className='text-sm font-semibold'>행사 소개</h2>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--color-text-secondary)]'>
              {culture.overview}
            </p>
          </section>
        )}

        {culture.programIntroduction && (
          <section className='mt-6 border-t border-[var(--color-border-primary)] pt-5'>
            <h2 className='text-sm font-semibold'>프로그램</h2>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--color-text-secondary)]'>
              {culture.programIntroduction}
            </p>
          </section>
        )}

        {hasExternalLinks && (
          <nav
            className='mt-6 grid auto-cols-fr grid-flow-col gap-2.5 border-t border-[var(--color-border-primary)] pt-5'
            aria-label='행사 링크'
          >
            {culture.homepageAddress && (
              <a
                href={culture.homepageAddress}
                target='_blank'
                rel='noreferrer'
                className='soft-chip flex h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold'
              >
                공식 홈페이지
              </a>
            )}
            {culture.homepageDetailAddress && (
              <a
                href={culture.homepageDetailAddress}
                target='_blank'
                rel='noreferrer'
                className='flex h-11 items-center justify-center rounded-lg bg-[var(--color-brand-primary)] px-3 text-sm font-semibold text-[var(--color-brand-on-primary)]'
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
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleBottomSheetClose = useCallback(() => {
    router.replace('/map', { scroll: false });
  }, [router]);

  const handleBottomSheetBack = useCallback(() => {
    router.replace('/map?list=open', { scroll: false });
  }, [router]);

  useEffect(() => {
    setImgSrc(culture?.mainImage);
    setImageFailed(false);
  }, [culture?.mainImage]);

  const renderFooter = useCallback(() => {
    if (!culture) {
      return null;
    }

    const hasHomepage = Boolean(culture.homepageAddress);
    const hasBookingLink = Boolean(culture.homepageDetailAddress);
    if (!hasHomepage && !hasBookingLink) return null;

    return (
      <div className={`grid gap-2.5 ${hasHomepage && hasBookingLink ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {hasHomepage && (
          <Button
            fullWidth
            ariaLabel='행사 공식 홈페이지로 이동'
            onClick={() => handleOpenExternalLink(culture.homepageAddress)}
            variant='secondary'
          >
            <span>공식 홈페이지</span>
            <ExternalLink aria-hidden='true' className='ml-1.5 size-4' strokeWidth={1.8} />
          </Button>
        )}
        {hasBookingLink && (
          <Button
            fullWidth
            ariaLabel='예약 웹사이트로 이동'
            onClick={() => handleOpenExternalLink(culture.homepageDetailAddress)}
          >
            <span>예약하기</span>
            <ExternalLink aria-hidden='true' className='ml-1.5 size-4' strokeWidth={1.8} />
          </Button>
        )}
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
          <p role='alert' className='text-center'>
            죄송합니다, 데이터를 불러오는 중에 문제가 발생했습니다.
          </p>
          <Button ariaLabel='다시 시도' onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </div>
      );
    }
    if (!culture) {
      return (
        <div className='surface-card flex flex-col items-center justify-center gap-4 rounded-xl p-6 text-center'>
          <p className='text-lg font-semibold'>행사 정보를 찾을 수 없습니다.</p>
          <Button ariaLabel='목록으로 돌아가기' onClick={() => router.push('/map')}>
            목록으로 돌아가기
          </Button>
        </div>
      );
    }

    const hasCultureImage = Boolean(imgSrc) && !imageFailed && !imgSrc?.includes('/assets/images/logo');

    return (
      <div className='flex flex-col gap-5'>
        <div>
          <p className='route-kicker'>선택한 행사</p>
          <h1 className='mt-3 text-[1.55rem] font-semibold leading-[1.2] tracking-[-0.03em] sm:text-[1.75rem]'>
            {culture.title}
          </h1>
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <CultureCategoryBadge classification={culture.classification} className='px-3 py-1.5' />
          {culture.guName && (
            <span className='soft-chip rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)]'>
              {culture.guName}
            </span>
          )}
          <span className='soft-chip rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)]'>
            {culture.displayPrice}
          </span>
        </div>

        <div className='grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-border-primary)]'>
          <div className='bg-[var(--color-surface-secondary)] px-3 py-3'>
            <div className='flex items-center gap-1.5 text-[var(--color-text-secondary)]'>
              <CalendarDays aria-hidden='true' className='size-3.5' strokeWidth={1.8} />
              <p className='text-[0.68rem] font-semibold'>일정</p>
            </div>
            <p className='mt-1 text-sm font-semibold leading-5'>{culture.displayDate}</p>
          </div>
          <div className='bg-[var(--color-surface-secondary)] px-3 py-3'>
            <div className='flex items-center gap-1.5 text-[var(--color-text-secondary)]'>
              <MapPin aria-hidden='true' className='size-3.5' strokeWidth={1.8} />
              <p className='text-[0.68rem] font-semibold'>장소</p>
            </div>
            <p className='mt-1 break-words text-sm font-semibold leading-5'>{culture.place || culture.guName}</p>
          </div>
        </div>

        <div className='relative aspect-[4/3] overflow-hidden rounded-[18px] bg-[var(--color-bg-tertiary)]'>
          {hasCultureImage ? (
            <Image
              src={imgSrc as string}
              alt={culture.title}
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
        {(culture.additionalImages ?? []).length > 0 && (
          <div className='flex gap-2 overflow-x-auto pb-1' aria-label='행사 추가 이미지'>
            {(culture.additionalImages ?? []).map(image => (
              <button
                type='button'
                key={image.url}
                onClick={() => {
                  setImgSrc(image.url);
                  setImageFailed(false);
                }}
                className='relative size-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]'
                aria-label={image.name || '추가 이미지 보기'}
                aria-pressed={imgSrc === image.url}
              >
                <Image src={image.thumbnailUrl} alt='' fill sizes='72px' className='object-cover' />
              </button>
            ))}
          </div>
        )}

        <div className='border-t border-[var(--color-border-primary)] pt-4'>
          <dl className='grid gap-2 text-sm leading-6 text-[var(--color-text-secondary)]'>
            <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
              <dt className='font-semibold text-[var(--color-text-primary)]'>대상</dt>
              <dd className='break-words'>{culture.useTarget || '정보 없음'}</dd>
            </div>
            <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
              <dt className='font-semibold text-[var(--color-text-primary)]'>주최</dt>
              <dd className='break-words'>{culture.organizationName || '정보 없음'}</dd>
            </div>
            {culture.eventTime && (
              <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
                <dt className='font-semibold text-[var(--color-text-primary)]'>시간</dt>
                <dd className='whitespace-pre-line break-words'>{culture.eventTime}</dd>
              </div>
            )}
            {culture.duration && (
              <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
                <dt className='font-semibold text-[var(--color-text-primary)]'>소요</dt>
                <dd className='whitespace-pre-line break-words'>{culture.duration}</dd>
              </div>
            )}
          </dl>
        </div>

        {culture.overview && (
          <section className='border-t border-[var(--color-border-primary)] pt-4'>
            <p className='text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[var(--color-brand-primary)]'>
              행사 소개
            </p>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--color-text-secondary)]'>
              {culture.overview}
            </p>
          </section>
        )}

        {culture.programIntroduction && (
          <section className='border-t border-[var(--color-border-primary)] pt-4'>
            <p className='text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[var(--color-brand-primary)]'>
              프로그램
            </p>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--color-text-secondary)]'>
              {culture.programIntroduction}
            </p>
          </section>
        )}

        {(culture.bookingPlace ||
          culture.placeInformation ||
          culture.contact ||
          culture.festivalGrade ||
          culture.discountInformation) && (
          <section className='border-t border-[var(--color-border-primary)] pt-4'>
            <p className='text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[var(--color-brand-primary)]'>
              이용 안내
            </p>
            <dl className='mt-2 grid gap-2 text-sm leading-6 text-[var(--color-text-secondary)]'>
              {culture.bookingPlace && (
                <div className='grid grid-cols-[3.8rem_1fr] gap-3'>
                  <dt className='font-semibold text-[var(--color-text-primary)]'>예매처</dt>
                  <dd className='whitespace-pre-line break-words'>{culture.bookingPlace}</dd>
                </div>
              )}
              {culture.placeInformation && (
                <div className='grid grid-cols-[3.8rem_1fr] gap-3'>
                  <dt className='font-semibold text-[var(--color-text-primary)]'>행사장</dt>
                  <dd className='whitespace-pre-line break-words'>{culture.placeInformation}</dd>
                </div>
              )}
              {culture.contact && (
                <div className='grid grid-cols-[3.8rem_1fr] gap-3'>
                  <dt className='font-semibold text-[var(--color-text-primary)]'>문의</dt>
                  <dd className='whitespace-pre-line break-words'>{culture.contact}</dd>
                </div>
              )}
              {culture.festivalGrade && (
                <div className='grid grid-cols-[3.8rem_1fr] gap-3'>
                  <dt className='font-semibold text-[var(--color-text-primary)]'>등급</dt>
                  <dd className='break-words'>{culture.festivalGrade}</dd>
                </div>
              )}
              {culture.discountInformation && (
                <div className='grid grid-cols-[3.8rem_1fr] gap-3'>
                  <dt className='font-semibold text-[var(--color-text-primary)]'>할인</dt>
                  <dd className='whitespace-pre-line break-words'>{culture.discountInformation}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {(culture.additionalInformation ?? []).length > 0 && (
          <details className='group border-t border-[var(--color-border-primary)] pt-4'>
            <summary className='flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold'>
              <span className='text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[var(--color-brand-primary)]'>
                상세 안내
              </span>
              <span className='text-xs text-[var(--color-text-secondary)] group-open:hidden'>열기</span>
              <span className='hidden text-xs text-[var(--color-text-secondary)] group-open:inline'>닫기</span>
            </summary>
            <dl className='mt-3 grid gap-3 text-sm leading-6 text-[var(--color-text-secondary)]'>
              {(culture.additionalInformation ?? []).map((item, index) => (
                <div key={`${item.name}:${index}`}>
                  <dt className='font-semibold text-[var(--color-text-primary)]'>{item.name}</dt>
                  <dd className='mt-1 whitespace-pre-line break-words'>{item.text}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        {ADSENSE_DETAIL_SLOT && (
          <div className='surface-card rounded-xl p-2.5'>
            <GoogleAdSlot slot={ADSENSE_DETAIL_SLOT} className='min-h-[88px]' />
          </div>
        )}
      </div>
    );
  }, [isLoading, error, culture, imgSrc, imageFailed, handleImageError, router]);

  useEffect(() => {
    const signature = `${cultureId}:${isLoading ? 'loading' : 'ready'}:${error?.message ?? 'no-error'}:${culture?.id ?? 'no-culture'}:${imgSrc ?? 'no-image'}:${imageFailed ? 'image-failed' : 'image-ready'}`;
    if (lastSheetSignatureRef.current === signature) {
      return;
    }

    lastSheetSignatureRef.current = signature;

    openBottomSheet({
      content: renderContent(),
      footer: renderFooter(),
      onClose: handleBottomSheetClose,
      onBack: handleBottomSheetBack,
      backLabel: '목록',
      closeOnRouteExit: true,
    });
  }, [
    culture?.id,
    cultureId,
    error?.message,
    handleBottomSheetClose,
    handleBottomSheetBack,
    imageFailed,
    imgSrc,
    isLoading,
    openBottomSheet,
    renderContent,
    renderFooter,
  ]);

  return mounted ? null : <MapDetailFallback culture={initialCulture} />;
};

export default MapDetailSheetClient;
