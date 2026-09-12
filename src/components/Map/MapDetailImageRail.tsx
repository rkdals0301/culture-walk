import CultureImageFallback from '@/components/Common/CultureImageFallback';
import type { FormattedCultureDetail } from '@/types/culture';

import Image from 'next/image';

interface MapDetailImageRailProps {
  culture: FormattedCultureDetail;
  imageSrc?: string;
  failedAdditionalImages: Record<string, boolean>;
  onSelectImage: (url: string) => void;
  onAdditionalImageError: (url: string) => void;
}

export const MapDetailImageRail = ({
  culture,
  imageSrc,
  failedAdditionalImages,
  onSelectImage,
  onAdditionalImageError,
}: MapDetailImageRailProps) => {
  if ((culture.additionalImages ?? []).length === 0) return null;

  return (
    <div className='flex gap-2.5 overflow-x-auto pb-1' aria-label='행사 추가 이미지'>
      {(culture.additionalImages ?? []).map(image => (
        <button
          type='button'
          key={image.url}
          onClick={() => onSelectImage(image.url)}
          className={`relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl border bg-[var(--color-surface-chip)] transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] ${
            imageSrc === image.url
              ? 'ring-[var(--color-brand-primary)]/40 border-[var(--color-brand-primary)] shadow-xs ring-2'
              : 'border-[var(--color-border-primary)] hover:border-[var(--color-border-control)]'
          }`}
          aria-label={image.name || '추가 이미지 보기'}
          aria-pressed={imageSrc === image.url}
        >
          {typeof image.thumbnailUrl === 'string' &&
          image.thumbnailUrl.trim() &&
          !failedAdditionalImages[image.url] ? (
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
  );
};
