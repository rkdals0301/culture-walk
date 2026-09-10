import { getCultureTone } from '@/utils/cultureCategory';

import Image from 'next/image';

interface CultureImageFallbackProps {
  compact?: boolean;
  classification?: string;
  priority?: boolean;
}

const FALLBACK_ART_BY_TONE = {
  education: '/assets/images/fallback-education.svg',
  exhibition: '/assets/images/fallback-exhibition.svg',
  festival: '/assets/images/fallback-festival.svg',
  performance: '/assets/images/fallback-performance.svg',
  other: '/assets/images/fallback-neutral.svg',
} as const;

const FALLBACK_LABEL_BY_TONE = {
  education: '교육·체험',
  exhibition: '전시·미술',
  festival: '축제',
  performance: '공연',
  other: '문화행사',
} as const;

const CultureImageFallback = ({ compact = false, classification, priority = false }: CultureImageFallbackProps) => {
  const tone = getCultureTone(classification);
  const fallbackLabel = FALLBACK_LABEL_BY_TONE[tone];
  const fallbackArt = FALLBACK_ART_BY_TONE[tone];

  return (
    <div
      className='relative size-full overflow-hidden bg-[var(--color-image-fallback-surface)] text-white'
      role='img'
      aria-label={`${classification || '문화행사'} 대표 이미지 없음`}
    >
      <Image
        src={fallbackArt}
        alt=''
        aria-hidden='true'
        draggable={false}
        fill
        sizes={compact ? '96px' : '(max-width: 640px) 50vw, 480px'}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        unoptimized
        className='size-full select-none object-cover'
      />
      <div
        className={
          compact
            ? 'absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/45 to-transparent px-2 pb-2 pt-7'
            : 'from-slate-950/88 via-slate-950/52 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-4 pb-4 pt-16 sm:px-5 sm:pb-5'
        }
      >
        {!compact && (
          <span className='text-white/72 mb-1 block text-[0.62rem] font-semibold tracking-[0.08em]'>
            대표 이미지 없음
          </span>
        )}
        <span
          className={
            compact
              ? 'block truncate text-[0.68rem] font-bold'
              : 'block text-base font-extrabold tracking-tight sm:text-lg'
          }
        >
          {fallbackLabel}
        </span>
      </div>
    </div>
  );
};

export default CultureImageFallback;
