import GoogleAdSlot from '@/components/Ads/GoogleAdSlot';
import Button from '@/components/Common/Button';
import CultureCategoryBadge from '@/components/Common/CultureCategoryBadge';
import CultureImageFallback from '@/components/Common/CultureImageFallback';
import { CultureDetailFacts, CultureDetailPoster } from '@/components/Map/MapDetailShared';
import type { FormattedCulture } from '@/types/culture';
import { getCulturePriceTone } from '@/utils/cultureUtils';

import Image from 'next/image';
import Link from 'next/link';

import { ExternalLink } from 'lucide-react';

import ArrowBackIcon from '../../../public/assets/images/arrow-back-icon.svg';

const ADSENSE_DETAIL_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_DETAIL_PANEL;

const PRICE_BADGE_CLASS_NAMES = {
  free: 'border-[var(--color-success-subtle)] bg-[var(--color-success-subtle)] text-[var(--color-success-text)]',
  partial: 'border-[var(--color-warning-subtle)] bg-[var(--color-warning-subtle)] text-[var(--color-warning-text)]',
  paid: 'border-[var(--color-accent-subtle)] bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)]',
  unknown: 'border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)]',
} as const;

export const MapDetailFallback = ({ culture }: { culture: FormattedCulture }) => {
  const hasExternalLinks = Boolean(culture.homepageAddress || culture.homepageDetailAddress);

  return (
    <article className='bottom-sheet-panel surface-panel pointer-events-auto fixed inset-x-0 bottom-0 z-50 flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden rounded-b-none rounded-t-[24px] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] shadow-2xl md:inset-x-auto md:left-auto md:right-6 md:w-[420px] lg:h-auto min-[1280px]:left-[var(--map-sidebar-width)] min-[1280px]:right-auto min-[1280px]:h-[calc(100dvh-72px)] min-[1280px]:w-[480px] min-[1280px]:rounded-none min-[1280px]:border-b-0 min-[1280px]:border-l-0 min-[1280px]:border-t-0 min-[1280px]:shadow-none'>
      <div className='flex shrink-0 items-center justify-center pb-1 pt-2 lg:hidden' aria-hidden='true'>
        <div className='h-1.5 w-10 rounded-full bg-[var(--color-text-tertiary)]/35' />
      </div>
      <header className='border-b border-[var(--color-border-primary)] px-5 pb-5 pt-2 lg:pt-4'>
        <Link
          href='/map'
          className='mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand-primary)] transition hover:opacity-80'
        >
          <ArrowBackIcon className='size-3.5' />
          지도 목록
        </Link>
        <div className='flex items-center gap-2'>
          <CultureCategoryBadge classification={culture.classification} className='px-2.5 py-0.5 text-xs' />
          {culture.guName && (
            <span className='text-xs font-semibold text-[var(--color-text-secondary)]'>{culture.guName}</span>
          )}
        </div>
        <h1 className='mt-2.5 text-xl font-bold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-2xl'>
          {culture.title}
        </h1>
      </header>

      <div className='bottom-sheet-scroll-region min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5'>
        <CultureDetailPoster culture={culture} priority />
        <CultureDetailFacts culture={culture} />

        {culture.overview && (
          <section className='mt-6 border-t border-[var(--color-border-primary)] pt-5'>
            <h2 className='text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)]'>행사 소개</h2>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-[var(--color-text-secondary)]'>
              {culture.overview}
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
                className='flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-3 text-xs font-bold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-chip)]'
              >
                <span>공식 홈페이지</span>
                <ExternalLink aria-hidden='true' className='size-3.5 opacity-70' strokeWidth={2} />
              </a>
            )}
            {culture.homepageDetailAddress && (
              <a
                href={culture.homepageDetailAddress}
                target='_blank'
                rel='noreferrer'
                className='shadow-xs flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-brand-primary)] px-3 text-xs font-bold text-white transition hover:bg-[var(--color-brand-hover)]'
              >
                <span>예약 / 상세</span>
                <ExternalLink aria-hidden='true' className='size-3.5' strokeWidth={2} />
              </a>
            )}
          </nav>
        )}
      </div>
    </article>
  );
};

interface MapDetailSheetFooterProps {
  culture: FormattedCulture;
  onOpenExternalLink: (url?: string) => void;
}

export const MapDetailSheetFooter = ({ culture, onOpenExternalLink }: MapDetailSheetFooterProps) => {
  const hasHomepage = Boolean(culture.homepageAddress);
  const hasBookingLink = Boolean(culture.homepageDetailAddress);
  if (!hasHomepage && !hasBookingLink) return null;

  return (
    <div className={`grid gap-2.5 ${hasHomepage && hasBookingLink ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {hasHomepage && (
        <Button
          fullWidth
          ariaLabel='행사 공식 홈페이지로 이동'
          onClick={() => onOpenExternalLink(culture.homepageAddress)}
          variant='secondary'
        >
          <span>공식 홈페이지</span>
          <ExternalLink aria-hidden='true' className='ml-1.5 size-4' strokeWidth={1.8} />
        </Button>
      )}
      {hasBookingLink && (
        <Button fullWidth ariaLabel='예약 웹사이트로 이동' onClick={() => onOpenExternalLink(culture.homepageDetailAddress)}>
          <span>예약하기</span>
          <ExternalLink aria-hidden='true' className='ml-1.5 size-4' strokeWidth={1.8} />
        </Button>
      )}
    </div>
  );
};

interface MapDetailSheetContentProps {
  culture: FormattedCulture | null;
  imageSrc?: string;
  imageFailed: boolean;
  failedAdditionalImages: Record<string, boolean>;
  onBackToMap: () => void;
  onImageError: () => void;
  onSelectImage: (url: string) => void;
  onAdditionalImageError: (url: string) => void;
}

export const MapDetailSheetContent = ({
  culture,
  imageSrc,
  imageFailed,
  failedAdditionalImages,
  onBackToMap,
  onImageError,
  onSelectImage,
  onAdditionalImageError,
}: MapDetailSheetContentProps) => {
  if (!culture) {
    return (
      <div className='surface-card flex flex-col items-center justify-center gap-4 rounded-xl p-6 text-center'>
        <p className='text-lg font-semibold'>행사 정보를 찾을 수 없습니다.</p>
        <Button ariaLabel='목록으로 돌아가기' onClick={onBackToMap}>
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  const priceTone = getCulturePriceTone(culture);

  return (
    <div className='flex flex-col gap-4'>
      <div>
        <h1 className='text-xl font-bold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-2xl'>
          {culture.title}
        </h1>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <CultureCategoryBadge classification={culture.classification} className='px-3 py-1 text-xs' />
        {culture.guName && (
          <span className='shadow-2xs rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]'>
            {culture.guName}
          </span>
        )}
        <span className={`shadow-2xs rounded-full border px-3 py-1 text-xs font-bold ${PRICE_BADGE_CLASS_NAMES[priceTone]}`}>
          {culture.displayPrice}
        </span>
      </div>

      <CultureDetailPoster
        culture={culture}
        imageSrc={imageSrc}
        imageFailed={imageFailed}
        onImageError={onImageError}
        priority
      />

      {(culture.additionalImages ?? []).length > 0 && (
        <div className='flex gap-2.5 overflow-x-auto pb-1' aria-label='행사 추가 이미지'>
          {(culture.additionalImages ?? []).map(image => (
            <button
              type='button'
              key={image.url}
              onClick={() => onSelectImage(image.url)}
              className={`relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl border bg-[var(--color-surface-chip)] transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] ${
                imageSrc === image.url
                  ? 'ring-[var(--color-brand-primary)]/40 shadow-xs border-[var(--color-brand-primary)] ring-2'
                  : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-control)]'
              }`}
              aria-label={image.name || '추가 이미지 보기'}
              aria-pressed={imageSrc === image.url}
            >
              {typeof image.thumbnailUrl === 'string' && image.thumbnailUrl.trim() && !failedAdditionalImages[image.url] ? (
                <Image
                  src={image.thumbnailUrl}
                  alt=''
                  fill
                  sizes='72px'
                  className='object-cover'
                  onError={() => onAdditionalImageError(image.url)}
                />
              ) : (
                <CultureImageFallback compact classification={culture.classification} />
              )}
            </button>
          ))}
        </div>
      )}

      <CultureDetailFacts culture={culture} extended />

      {culture.overview && (
        <section className='border-t border-[var(--color-border-primary)] pt-4'>
          <p className='text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[var(--color-brand-primary)]'>행사 소개</p>
          <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--color-text-secondary)]'>
            {culture.overview}
          </p>
        </section>
      )}

      {culture.programIntroduction && (
        <section className='border-t border-[var(--color-border-primary)] pt-4'>
          <p className='text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[var(--color-brand-primary)]'>프로그램</p>
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
          <p className='text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[var(--color-brand-primary)]'>이용 안내</p>
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
};
