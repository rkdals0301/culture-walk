'use client';

import Button from '@/components/Common/Button';

import Link from 'next/link';

interface AppErrorFallbackProps {
  retry: () => void;
  fullScreen?: boolean;
}

const AppErrorFallback = ({ retry, fullScreen = false }: AppErrorFallbackProps) => (
  <section
    aria-labelledby='app-error-title'
    className={`grid ${fullScreen ? 'min-h-dvh' : 'min-h-[60dvh]'} place-content-center px-4 py-12 text-center`}
    role='alert'
  >
    <div className='mx-auto w-full max-w-xl rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] px-6 py-10 shadow-sm sm:px-10'>
      <p className='mb-2 text-sm font-semibold text-[var(--color-brand-primary)]'>일시적인 오류</p>
      <h1 id='app-error-title' className='text-2xl font-bold text-[var(--color-text-primary)]'>
        페이지를 표시할 수 없습니다.
      </h1>
      <p className='mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--color-text-secondary)]'>
        잠시 문제가 발생했습니다. 다시 시도하거나 홈으로 이동해주세요.
      </p>
      <div className='mt-7 flex flex-wrap items-center justify-center gap-3'>
        <Button ariaLabel='다시 시도' onClick={retry}>
          다시 시도
        </Button>
        <Link
          className='inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-[var(--color-text-primary)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]'
          href='/'
        >
          홈으로 이동
        </Link>
      </div>
    </div>
  </section>
);

export default AppErrorFallback;
