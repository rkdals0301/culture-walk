import CultureImageFallback from '@/components/Common/CultureImageFallback';
import type { FormattedCulture } from '@/types/culture';

import Image from 'next/image';

interface CultureDetailPosterProps {
  culture: FormattedCulture;
  imageSrc?: string;
  imageFailed?: boolean;
  onImageError?: () => void;
  priority?: boolean;
}

export const CultureDetailPoster = ({
  culture,
  imageSrc = culture.mainImage,
  imageFailed = false,
  onImageError,
  priority = false,
}: CultureDetailPosterProps) => {
  const hasCultureImage =
    typeof imageSrc === 'string' &&
    Boolean(imageSrc.trim()) &&
    !imageFailed &&
    !imageSrc.includes('/assets/images/logo');

  return (
    <div className='relative w-full overflow-hidden rounded-2xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] shadow-xs'>
      {hasCultureImage ? (
        <div className='relative flex aspect-[3/4] max-h-[380px] w-full items-center justify-center overflow-hidden bg-black/10'>
          <div className='pointer-events-none absolute inset-0 select-none overflow-hidden' aria-hidden='true'>
            <Image
              src={imageSrc}
              alt=''
              fill
              sizes='120px'
              className='scale-125 object-cover opacity-35 blur-xl'
            />
            <div className='absolute inset-0 bg-black/15' />
          </div>
          <div className='relative z-10 size-full p-2.5'>
            <Image
              src={imageSrc}
              alt={culture.title}
              onError={onImageError}
              fill
              sizes='(min-width: 1024px) 520px, 100dvw'
              priority={priority}
              className='object-contain drop-shadow-md'
            />
          </div>
        </div>
      ) : (
        <div className='aspect-[16/9] w-full'>
          <CultureImageFallback classification={culture.classification || '문화행사'} />
        </div>
      )}
    </div>
  );
};

interface CultureDetailFactsProps {
  culture: FormattedCulture;
  extended?: boolean;
}

export const CultureDetailFacts = ({ culture, extended = false }: CultureDetailFactsProps) => (
  <dl className='divide-y divide-[var(--color-border-primary)] border-y border-[var(--color-border-primary)] text-sm'>
    <div className='flex items-baseline justify-between gap-4 py-3'>
      <dt className='shrink-0 text-xs font-medium text-[var(--color-text-tertiary)]'>일정</dt>
      <dd className='text-right font-semibold text-[var(--color-text-primary)]'>{culture.displayDate}</dd>
    </div>
    <div className='flex items-baseline justify-between gap-4 py-3'>
      <dt className='shrink-0 text-xs font-medium text-[var(--color-text-tertiary)]'>장소</dt>
      <dd className='break-words text-right font-semibold text-[var(--color-text-primary)]'>
        {culture.place || culture.guName}
      </dd>
    </div>
    <div className='flex items-baseline justify-between gap-4 py-3'>
      <dt className='shrink-0 text-xs font-medium text-[var(--color-text-tertiary)]'>관람료</dt>
      <dd className='whitespace-pre-line text-right font-semibold text-[var(--color-text-primary)]'>
        {culture.useFee || culture.displayPrice}
      </dd>
    </div>
    {extended && culture.useTarget && (
      <div className='flex items-baseline justify-between gap-4 py-3'>
        <dt className='shrink-0 text-xs font-medium text-[var(--color-text-tertiary)]'>대상</dt>
        <dd className='text-right font-semibold text-[var(--color-text-primary)]'>{culture.useTarget}</dd>
      </div>
    )}
    {extended && culture.organizationName && (
      <div className='flex items-baseline justify-between gap-4 py-3'>
        <dt className='shrink-0 text-xs font-medium text-[var(--color-text-tertiary)]'>주최</dt>
        <dd className='text-right font-semibold text-[var(--color-text-primary)]'>{culture.organizationName}</dd>
      </div>
    )}
    {extended && culture.eventTime && (
      <div className='flex items-baseline justify-between gap-4 py-3'>
        <dt className='shrink-0 text-xs font-medium text-[var(--color-text-tertiary)]'>시간</dt>
        <dd className='whitespace-pre-line text-right font-semibold text-[var(--color-text-primary)]'>
          {culture.eventTime}
        </dd>
      </div>
    )}
    {extended && culture.duration && (
      <div className='flex items-baseline justify-between gap-4 py-3'>
        <dt className='shrink-0 text-xs font-medium text-[var(--color-text-tertiary)]'>소요</dt>
        <dd className='whitespace-pre-line text-right font-semibold text-[var(--color-text-primary)]'>
          {culture.duration}
        </dd>
      </div>
    )}
  </dl>
);
