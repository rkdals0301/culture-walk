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
import CloseIcon from '../../../public/assets/images/close-icon.svg';

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
            <dd className='mt-1 whitespace-pre-line font-semibold'>{culture.useFee || culture.displayPrice}</dd>
          </div>
          <div>
            <dt className='text-[0.7rem] font-semibold text-[var(--app-muted)]'>대상</dt>
            <dd className='mt-1'>{culture.useTarget || '정보 없음'}</dd>
          </div>
          <div>
            <dt className='text-[0.7rem] font-semibold text-[var(--app-muted)]'>주최</dt>
            <dd className='mt-1'>{culture.organizationName || '정보 없음'}</dd>
          </div>
        </dl>

        {culture.overview && (
          <section className='mt-6 border-t border-[var(--app-border)] pt-5'>
            <h2 className='text-sm font-semibold'>행사 소개</h2>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--app-muted)]'>
              {culture.overview}
            </p>
          </section>
        )}

        {culture.programIntroduction && (
          <section className='mt-6 border-t border-[var(--app-border)] pt-5'>
            <h2 className='text-sm font-semibold'>프로그램</h2>
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
  const { openBottomSheet, setOverlayOpen } = useBottomSheet();
  const lastSheetSignatureRef = useRef('');
  const galleryImages = useMemo(() => {
    if (!culture) {
      return [];
    }

    const images = [
      ...(culture.mainImage ? [{ url: culture.mainImage, name: '대표 이미지' }] : []),
      ...(culture.additionalImages ?? []).map(image => ({ url: image.url, name: image.name || '추가 이미지' })),
    ];
    const seen = new Set<string>();

    return images.filter(image => {
      if (!image.url || seen.has(image.url)) {
        return false;
      }

      seen.add(image.url);
      return true;
    });
  }, [culture]);

  const [mounted, setMounted] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(culture?.mainImage);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState<number | null>(null);

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
    router.replace('/map', { scroll: false });
  }, [router]);

  useEffect(() => {
    setImgSrc(culture?.mainImage);
    setImageFailed(false);
    setImageViewerIndex(null);
    setOverlayOpen(false);
  }, [culture?.mainImage, setOverlayOpen]);

  const openImageViewer = useCallback(
    (imageUrl?: string) => {
      if (!imageUrl) {
        return;
      }

      const index = galleryImages.findIndex(image => image.url === imageUrl);
      if (index >= 0) {
        setImageViewerIndex(index);
        setOverlayOpen(true);
      }
    },
    [galleryImages, setOverlayOpen]
  );

  const closeImageViewer = useCallback(() => {
    setImageViewerIndex(null);
    setOverlayOpen(false);
  }, [setOverlayOpen]);

  useEffect(() => {
    return () => setOverlayOpen(false);
  }, [setOverlayOpen]);

  useEffect(() => {
    if (imageViewerIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeImageViewer();
      }

      if (galleryImages.length < 2) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        setImageViewerIndex(index => (index === null ? 0 : (index - 1 + galleryImages.length) % galleryImages.length));
      }

      if (event.key === 'ArrowRight') {
        setImageViewerIndex(index => (index === null ? 0 : (index + 1) % galleryImages.length));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeImageViewer, galleryImages.length, imageViewerIndex]);

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
            <span className='ml-1.5 text-base' aria-hidden='true'>
              ↗
            </span>
          </Button>
        )}
        {hasBookingLink && (
          <Button
            fullWidth
            ariaLabel='예약 웹사이트로 이동'
            onClick={() => handleOpenExternalLink(culture.homepageDetailAddress)}
          >
            <span>예약하기</span>
            <span className='ml-1.5 text-base' aria-hidden='true'>
              ↗
            </span>
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
            <button
              type='button'
              onClick={() => openImageViewer(imgSrc)}
              className='group relative size-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f765f]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-surface)]'
              aria-label={`${culture.title} 이미지 확대`}
            >
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
              <span className='absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full bg-black/55 text-lg font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'>
                +
              </span>
            </button>
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
                  openImageViewer(image.url);
                }}
                className='relative size-[4.5rem] shrink-0 overflow-hidden rounded-lg border border-[var(--app-border)] bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f765f]/50'
                aria-label={image.name || '추가 이미지 보기'}
                aria-pressed={imgSrc === image.url}
              >
                <Image
                  src={image.thumbnailUrl}
                  alt=''
                  fill
                  sizes='72px'
                  className='object-cover'
                />
              </button>
            ))}
          </div>
        )}
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
            <p className='mt-1 whitespace-pre-line break-words text-sm font-semibold leading-5'>
              {culture.useFee || culture.displayPrice}
            </p>
          </div>
        </div>

        <div className='surface-card rounded-[18px] p-4'>
          <dl className='grid gap-2 text-sm leading-6 text-[var(--app-muted)]'>
            <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
              <dt className='font-semibold text-[var(--app-text)]'>대상</dt>
              <dd className='break-words'>{culture.useTarget || '정보 없음'}</dd>
            </div>
            <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
              <dt className='font-semibold text-[var(--app-text)]'>주최</dt>
              <dd className='break-words'>{culture.organizationName || '정보 없음'}</dd>
            </div>
            {culture.eventTime && (
              <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
                <dt className='font-semibold text-[var(--app-text)]'>시간</dt>
                <dd className='whitespace-pre-line break-words'>{culture.eventTime}</dd>
              </div>
            )}
            {culture.duration && (
              <div className='grid grid-cols-[3.3rem_1fr] gap-3'>
                <dt className='font-semibold text-[var(--app-text)]'>소요</dt>
                <dd className='whitespace-pre-line break-words'>{culture.duration}</dd>
              </div>
            )}
          </dl>
        </div>

        {culture.overview && (
          <div className='surface-card rounded-[18px] p-4'>
            <p className='text-[0.72rem] font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>행사 소개</p>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--app-muted)]'>
              {culture.overview}
            </p>
          </div>
        )}

        {culture.programIntroduction && (
          <div className='surface-card rounded-[18px] p-4'>
            <p className='text-[0.72rem] font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>프로그램</p>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--app-muted)]'>
              {culture.programIntroduction}
            </p>
          </div>
        )}

        {(culture.bookingPlace ||
          culture.placeInformation ||
          culture.contact ||
          culture.festivalGrade ||
          culture.discountInformation) && (
          <div className='surface-card rounded-[18px] p-4'>
            <p className='text-[0.72rem] font-semibold text-[#1f765f] dark:text-[#8dc5b5]'>이용 안내</p>
            <dl className='mt-2 grid gap-2 text-sm leading-6 text-[var(--app-muted)]'>
              {culture.bookingPlace && (
                <div className='grid grid-cols-[3.8rem_1fr] gap-3'>
                  <dt className='font-semibold text-[var(--app-text)]'>예매처</dt>
                  <dd className='whitespace-pre-line break-words'>{culture.bookingPlace}</dd>
                </div>
              )}
              {culture.placeInformation && (
                <div className='grid grid-cols-[3.8rem_1fr] gap-3'>
                  <dt className='font-semibold text-[var(--app-text)]'>행사장</dt>
                  <dd className='whitespace-pre-line break-words'>{culture.placeInformation}</dd>
                </div>
              )}
              {culture.contact && (
                <div className='grid grid-cols-[3.8rem_1fr] gap-3'>
                  <dt className='font-semibold text-[var(--app-text)]'>문의</dt>
                  <dd className='whitespace-pre-line break-words'>{culture.contact}</dd>
                </div>
              )}
              {culture.festivalGrade && (
                <div className='grid grid-cols-[3.8rem_1fr] gap-3'>
                  <dt className='font-semibold text-[var(--app-text)]'>등급</dt>
                  <dd className='break-words'>{culture.festivalGrade}</dd>
                </div>
              )}
              {culture.discountInformation && (
                <div className='grid grid-cols-[3.8rem_1fr] gap-3'>
                  <dt className='font-semibold text-[var(--app-text)]'>할인</dt>
                  <dd className='whitespace-pre-line break-words'>{culture.discountInformation}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {(culture.additionalInformation ?? []).length > 0 && (
          <details className='surface-card group rounded-[18px] p-4'>
            <summary className='flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold'>
              <span className='text-[0.72rem] text-[#1f765f] dark:text-[#8dc5b5]'>상세 안내</span>
              <span className='text-xs text-[var(--app-muted)] group-open:hidden'>열기</span>
              <span className='hidden text-xs text-[var(--app-muted)] group-open:inline'>닫기</span>
            </summary>
            <dl className='mt-3 grid gap-3 text-sm leading-6 text-[var(--app-muted)]'>
              {(culture.additionalInformation ?? []).map((item, index) => (
                <div key={`${item.name}:${index}`}>
                  <dt className='font-semibold text-[var(--app-text)]'>{item.name}</dt>
                  <dd className='mt-1 whitespace-pre-line break-words'>{item.text}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}

        {ADSENSE_DETAIL_SLOT && (
          <div className='surface-card rounded-[18px] p-2.5'>
            <GoogleAdSlot slot={ADSENSE_DETAIL_SLOT} className='min-h-[88px]' />
          </div>
        )}
      </div>
    );
  }, [isLoading, error, culture, imgSrc, imageFailed, handleImageError, openImageViewer, router]);

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

  const viewerPosition = imageViewerIndex ?? 0;
  const selectedViewerImage = imageViewerIndex === null ? null : galleryImages[viewerPosition];

  return (
    <>
      {!mounted && <MapDetailFallback culture={initialCulture} />}
      {selectedViewerImage && (
        <div
          data-image-viewer
          className='fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 sm:p-8'
          role='dialog'
          aria-modal='true'
          aria-label='행사 이미지 확대 보기'
          onClick={closeImageViewer}
        >
          <div className='relative flex size-full max-w-6xl items-center justify-center' onClick={event => event.stopPropagation()}>
            <Image
              src={selectedViewerImage.url}
              alt={`${culture?.title || '문화행사'} - ${selectedViewerImage.name}`}
              fill
              sizes='100vw'
              className='pointer-events-none object-contain'
              priority
            />
            <button
              type='button'
              onClick={closeImageViewer}
              className='absolute right-0 top-0 z-10 flex size-11 items-center justify-center rounded-full bg-black/55 text-xl font-medium text-white transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
              aria-label='이미지 확대 보기 닫기'
            >
              <CloseIcon className='size-5' />
            </button>
            {galleryImages.length > 1 && (
              <>
                <button
                  type='button'
                  onClick={() =>
                    setImageViewerIndex(index =>
                      index === null ? 0 : (index - 1 + galleryImages.length) % galleryImages.length
                    )
                  }
                  className='absolute left-0 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-xl font-medium text-white transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
                  aria-label='이전 이미지'
                >
                  &lt;
                </button>
                <button
                  type='button'
                  onClick={() => setImageViewerIndex(index => (index === null ? 0 : (index + 1) % galleryImages.length))}
                  className='absolute right-0 top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-xl font-medium text-white transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
                  aria-label='다음 이미지'
                >
                  &gt;
                </button>
                <span className='absolute bottom-0 z-10 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white'>
                  {viewerPosition + 1} / {galleryImages.length}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MapDetailSheetClient;
