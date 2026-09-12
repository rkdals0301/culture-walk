import GoogleAdSlot from '@/components/Ads/GoogleAdSlot';
import Button from '@/components/Common/Button';
import CultureCategoryBadge from '@/components/Common/CultureCategoryBadge';
import { MapDetailImageRail } from '@/components/Map/MapDetailImageRail';
import { MapDetailInformationSections } from '@/components/Map/MapDetailInformationSections';
import { CultureDetailFacts, CultureDetailPoster } from '@/components/Map/MapDetailShared';
import type { FormattedCultureDetail } from '@/types/culture';
import { getCultureDetailViewModel } from '@/utils/cultureDetailViewModel';

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

export const MapDetailFallback = ({ culture }: { culture: FormattedCultureDetail }) => {
  const hasExternalLinks = Boolean(culture.homepageAddress || culture.homepageDetailAddress);

  return (
    <article className='bottom-sheet-panel surface-panel pointer-events-auto fixed inset-x-0 bottom-0 z-50 flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden rounded-b-none rounded-t-[24px] bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] shadow-2xl md:inset-x-auto md:left-auto md:right-6 md:w-[420px] lg:h-auto min-[1280px]:left-[var(--map-sidebar-width)] min-[1280px]:right-auto min-[1280px]:h-[calc(100dvh-72px)] min-[1280px]:w-[480px] min-[1280px]:rounded-none min-[1280px]:border-b-0 min-[1280px]:border-l-0 min-[1280px]:border-t-0 min-[1280px]:shadow-none'>
      <div className='flex shrink-0 items-center justify-center pb-1 pt-2 lg:hidden' aria-hidden='true'>
        <div className='bg-[var(--color-text-tertiary)]/35 h-1.5 w-10 rounded-full' />
      </div>
      <header className='border-b border-[var(--color-detail-divider)] px-5 pb-5 pt-2 lg:pt-4'>
        <div className='mb-4 flex items-center justify-between'>
          <Link
            href='/map'
            className='inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-brand-primary)] transition hover:opacity-80'
          >
            <ArrowBackIcon className='size-3.5' />
            지도 목록
          </Link>
          <Link
            href={`/cultures/${culture.id}`}
            className='inline-flex items-center gap-1 text-xs font-bold text-[var(--color-brand-primary)] transition hover:opacity-80'
          >
            전체 상세 보기
            <ExternalLink className='size-3' />
          </Link>
        </div>
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
          <section className='mt-6 border-t border-[var(--color-detail-divider)] pt-5'>
            <h2 className='text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)]'>행사 소개</h2>
            <p className='mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-[var(--color-text-secondary)]'>
              {culture.overview}
            </p>
          </section>
        )}

        {hasExternalLinks && (
          <nav
            className='mt-6 grid auto-cols-fr grid-flow-col gap-2.5 border-t border-[var(--color-detail-divider)] pt-5'
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
                className='flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[var(--color-brand-primary)] px-3 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--color-brand-hover)]'
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
  culture: FormattedCultureDetail;
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
        <Button
          fullWidth
          ariaLabel='예약 웹사이트로 이동'
          onClick={() => onOpenExternalLink(culture.homepageDetailAddress)}
        >
          <span>예약하기</span>
          <ExternalLink aria-hidden='true' className='ml-1.5 size-4' strokeWidth={1.8} />
        </Button>
      )}
    </div>
  );
};

interface MapDetailSheetContentProps {
  culture: FormattedCultureDetail | null;
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

  const { hasOverview, hasProgram, priceTone, visibleAdditionalInformation } = getCultureDetailViewModel(culture);
  return (
    <div className='flex flex-col gap-4'>
      <div>
        <h1 className='text-xl font-bold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-2xl'>
          {culture.title}
        </h1>
      </div>

      <div className='flex items-center justify-between gap-2'>
        <div className='flex flex-wrap items-center gap-2'>
          <CultureCategoryBadge classification={culture.classification} className='px-3 py-1 text-xs' />
          {culture.guName && (
            <span className='rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)] shadow-2xs'>
              {culture.guName}
            </span>
          )}
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold shadow-2xs ${PRICE_BADGE_CLASS_NAMES[priceTone]}`}
          >
            {culture.displayPrice}
          </span>
        </div>
        <Link
          href={`/cultures/${culture.id}`}
          className='inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] px-2.5 py-1 text-xs font-bold text-[var(--color-brand-primary)] shadow-2xs transition hover:bg-[var(--color-surface-chip)] active:scale-95'
        >
          <span>상세보기</span>
          <ExternalLink className='size-3' />
        </Link>
      </div>

      <CultureDetailPoster
        culture={culture}
        imageSrc={imageSrc}
        imageFailed={imageFailed}
        onImageError={onImageError}
        priority
      />

      <MapDetailImageRail
        culture={culture}
        imageSrc={imageSrc}
        failedAdditionalImages={failedAdditionalImages}
        onSelectImage={onSelectImage}
        onAdditionalImageError={onAdditionalImageError}
      />

      <CultureDetailFacts culture={culture} extended />
      <MapDetailInformationSections
        culture={culture}
        hasOverview={hasOverview}
        hasProgram={hasProgram}
        visibleAdditionalInformation={visibleAdditionalInformation}
      />

      {ADSENSE_DETAIL_SLOT && (
        <div className='surface-card rounded-xl p-2.5'>
          <GoogleAdSlot slot={ADSENSE_DETAIL_SLOT} className='min-h-[88px]' />
        </div>
      )}
    </div>
  );
};
