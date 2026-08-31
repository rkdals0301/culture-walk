import Link from 'next/link';

import type { ReactNode } from 'react';

interface InfoPageShellProps {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}

const InfoPageShell = ({ children, eyebrow, title, description }: InfoPageShellProps) => {
  return (
    <div className='h-full overflow-y-auto bg-[var(--app-bg)] px-4 pb-16 pt-28 text-[var(--app-text)] sm:px-6 lg:px-8'>
      <div className='mx-auto grid w-full max-w-5xl gap-10'>
        <section className='grid gap-5'>
          <div>
            <p className='text-xs font-semibold text-[var(--app-primary)]'>
              {eyebrow}
            </p>
            <h1 className='mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-4xl'>{title}</h1>
          </div>
          <p className='max-w-3xl text-base leading-7 text-[var(--app-muted)] sm:text-lg'>{description}</p>
          <div className='flex flex-wrap gap-3'>
            <Link
              href='/map'
              className='inline-flex min-h-11 items-center rounded-xl bg-[var(--app-primary)] px-5 text-sm font-semibold text-[var(--app-on-primary)] transition hover:bg-[var(--app-primary-hover)]'
            >
              지도 보기
            </Link>
          </div>
        </section>
        <section className='grid gap-5'>{children}</section>
      </div>
    </div>
  );
};

export default InfoPageShell;
