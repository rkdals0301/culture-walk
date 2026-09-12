import type { FormattedCultureDetail } from '@/types/culture';

import Link from 'next/link';

import { Compass, ExternalLink } from 'lucide-react';

export const createCultureMapExploreUrl = (culture: Pick<FormattedCultureDetail, 'id' | 'lat' | 'lng'>) => {
  const params = new URLSearchParams();
  params.set('focus', String(culture.id));
  params.set('selected', String(culture.id));
  params.set('lat', String(culture.lat));
  params.set('lng', String(culture.lng));
  params.set('level', '4');
  params.set('list', 'open');
  return `/map?${params.toString()}`;
};

const getPrimaryExternalAction = (culture: FormattedCultureDetail) => ({
  url: culture.homepageDetailAddress || culture.homepageAddress,
  label: culture.homepageDetailAddress ? '예약 / 상세 안내' : '공식 홈페이지 바로가기',
});

interface CultureDetailActionsProps {
  culture: FormattedCultureDetail;
}

export const CultureDetailDesktopActions = ({ culture }: CultureDetailActionsProps) => {
  const mapExploreUrl = createCultureMapExploreUrl(culture);
  const primary = getPrimaryExternalAction(culture);

  return (
    <div className='mt-5 hidden lg:flex lg:flex-col lg:gap-2'>
      {primary.url && (
        <a
          href={primary.url}
          target='_blank'
          rel='noreferrer'
          className='flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-brand-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-[0.99]'
        >
          <span>{primary.label}</span>
          <ExternalLink className='size-3.5' strokeWidth={1.8} />
        </a>
      )}
      <Link
        href={mapExploreUrl}
        className='flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--color-detail-divider)] bg-transparent px-4 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-chip)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-[0.99]'
      >
        <Compass className='size-3.5 text-[var(--color-brand-primary)]' strokeWidth={1.8} />
        <span>문화지도에서 위치 확인</span>
      </Link>
    </div>
  );
};

export const CultureDetailMobileActions = ({ culture }: CultureDetailActionsProps) => {
  const mapExploreUrl = createCultureMapExploreUrl(culture);
  const primary = getPrimaryExternalAction(culture);

  return (
    <footer className='fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-detail-divider)] bg-[var(--color-surface-primary)] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_-18px_rgba(15,23,42,0.26)] transition-colors lg:hidden'>
      <div className='mx-auto flex max-w-lg items-center justify-between gap-2'>
        <Link
          href={mapExploreUrl}
          aria-label='지도에서 위치 보기'
          className='flex size-10 items-center justify-center rounded-lg border border-[var(--color-detail-divider)] bg-transparent text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-chip)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
          title='지도에서 위치 보기'
        >
          <Compass className='size-4' strokeWidth={1.8} />
        </Link>

        {primary.url ? (
          <a
            href={primary.url}
            target='_blank'
            rel='noreferrer'
            className='flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--color-brand-primary)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-[0.98]'
          >
            <span>{primary.label}</span>
            <ExternalLink className='size-3.5 shrink-0' strokeWidth={1.8} />
          </a>
        ) : (
          <Link
            href={mapExploreUrl}
            className='flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-[var(--color-brand-primary)] px-3 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-[0.98]'
          >
            <Compass className='size-4 shrink-0' strokeWidth={1.8} />
            <span>지도에서 위치 확인하기</span>
          </Link>
        )}
      </div>
    </footer>
  );
};
