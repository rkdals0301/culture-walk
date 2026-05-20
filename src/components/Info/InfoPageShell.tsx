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
            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-[#1f765f] dark:text-[#8dc5b5]'>
              {eyebrow}
            </p>
            <h1 className='mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl'>{title}</h1>
          </div>
          <p className='max-w-3xl text-base leading-7 text-[var(--app-muted)] sm:text-lg'>{description}</p>
          <div className='flex flex-wrap gap-3'>
            <Link
              href='/map'
              className='inline-flex rounded-full bg-[#1f765f] px-5 py-2.5 text-sm font-semibold text-[#fff8f1] transition hover:bg-[#175846]'
            >
              지도 보기
            </Link>
            <Link
              href='/'
              className='soft-chip inline-flex rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--app-text)] transition hover:bg-black/[0.06] dark:hover:bg-white/[0.08]'
            >
              홈으로
            </Link>
          </div>
        </section>
        <section className='grid gap-5'>{children}</section>
      </div>
    </div>
  );
};

export default InfoPageShell;
