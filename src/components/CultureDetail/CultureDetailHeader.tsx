'use client';

import ThemeToggleButton from '@/components/Theme/ThemeToggleButton';
import type { FormattedCultureDetail } from '@/types/culture';

import { useCallback } from 'react';
import { toast } from 'react-toastify';

import { useRouter } from 'next/navigation';

import { ArrowLeft, Share2 } from 'lucide-react';

interface CultureDetailHeaderProps {
  culture: FormattedCultureDetail;
}

const CultureDetailHeader = ({ culture }: CultureDetailHeaderProps) => {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }, [router]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${culture.title} | 문화산책`,
      text: `${culture.title} - ${culture.displayDate} (${culture.displayPlace})`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') toast.error('공유에 실패했습니다.');
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('행사 링크가 복사되었습니다.');
    } catch {
      toast.error('링크 복사에 실패했습니다.');
    }
  }, [culture.displayDate, culture.displayPlace, culture.title]);

  return (
    <header className='sticky top-0 z-40 border-b border-[var(--color-detail-divider)] bg-[var(--color-surface-primary)] transition-colors'>
      <div className='mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        <button
          type='button'
          onClick={handleBack}
          aria-label='이전 페이지로 돌아가기'
          className='flex size-9 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
        >
          <ArrowLeft className='size-5' strokeWidth={1.8} />
        </button>

        <div className='flex min-w-0 flex-1 items-center justify-center px-4'>
          <span className='truncate text-[0.9375rem] font-semibold text-[var(--color-text-secondary)] sm:text-sm'>
            {culture.title}
          </span>
        </div>

        <div className='flex items-center gap-1'>
          <button
            type='button'
            onClick={handleShare}
            aria-label='행사 링크 공유하기'
            className='flex size-9 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-chip)] hover:text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
          >
            <Share2 className='size-4' strokeWidth={1.8} />
          </button>
          <ThemeToggleButton />
        </div>
      </div>
    </header>
  );
};

export default CultureDetailHeader;
