'use client';

import Button from '@/components/Common/Button';

import Link from 'next/link';

interface CultureDetailErrorProps {
  retry: () => void;
  backHref: string;
  backLabel: string;
}

const CultureDetailError = ({ retry, backHref, backLabel }: CultureDetailErrorProps) => (
  <div className='mx-auto flex min-h-[60vh] w-full max-w-2xl items-center justify-center px-4 py-16 sm:px-6'>
    <section
      aria-labelledby='culture-detail-error-title'
      className='w-full rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] px-6 py-10 text-center shadow-sm sm:px-10'
      role='alert'
    >
      <p className='mb-2 text-sm font-semibold text-[var(--color-brand-primary)]'>일시적인 오류</p>
      <h1 id='culture-detail-error-title' className='text-2xl font-bold text-[var(--color-text-primary)]'>
        행사 정보를 불러오지 못했습니다.
      </h1>
      <p className='mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--color-text-secondary)]'>
        행사 정보가 잠시 응답하지 않고 있습니다. 잠시 후 다시 시도해주세요.
      </p>
      <div className='mt-7 flex flex-wrap items-center justify-center gap-3'>
        <Button ariaLabel='다시 시도' onClick={retry}>
          다시 시도
        </Button>
        <Link
          className='inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-[var(--color-text-primary)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]'
          href={backHref}
        >
          {backLabel}
        </Link>
      </div>
    </section>
  </div>
);

export default CultureDetailError;
