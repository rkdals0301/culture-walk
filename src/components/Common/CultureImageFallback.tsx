import { getCultureTone } from '@/utils/cultureCategory';

import Image from 'next/image';

interface CultureImageFallbackProps {
  compact?: boolean;
  classification?: string;
}

const FALLBACK_ART_BY_TONE = {
  education: '/assets/images/fallback-education.svg',
  exhibition: '/assets/images/fallback-exhibition.svg',
  festival: '/assets/images/fallback-festival.svg',
  performance: '/assets/images/fallback-performance.svg',
  other: '/assets/images/fallback-neutral.svg',
} as const;

const CultureImageFallback = ({ compact = false, classification }: CultureImageFallbackProps) => {
  const fallbackArt = FALLBACK_ART_BY_TONE[getCultureTone(classification)];

  return (
    <div
      className='relative size-full overflow-hidden bg-[var(--color-image-fallback-surface)]'
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
        unoptimized
        className={`size-full select-none object-cover ${compact ? 'scale-[1.03]' : ''}`}
      />
    </div>
  );
};

export default CultureImageFallback;
