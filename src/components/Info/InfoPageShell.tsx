import type { ReactNode } from 'react';

import Link from 'next/link';

import { ArrowUpRight, MapPinned } from 'lucide-react';

interface InfoPageShellProps {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}

const InfoPageShell = ({ children, eyebrow, title, description }: InfoPageShellProps) => {
  return (
    <div className='h-full overflow-y-auto bg-[var(--app-bg)] px-4 pb-20 pt-24 text-[var(--app-text)] sm:px-6 sm:pt-28 lg:px-10'>
      <div className='mx-auto grid w-full max-w-6xl gap-8 lg:gap-10'>
        <section className='relative border-b border-[var(--app-border)] pb-8 sm:pb-10 lg:pb-12'>
          <div
            aria-hidden='true'
            className='border-[var(--app-primary)]/15 pointer-events-none absolute -right-8 -top-8 hidden size-44 rounded-full border sm:block'
          />
          <div
            aria-hidden='true'
            className='pointer-events-none absolute -right-1 top-2 hidden size-2 rounded-full bg-[var(--app-accent)] sm:block'
          />
          <div className='relative grid gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end lg:gap-12'>
            <div>
              <p className='route-kicker'>{eyebrow}</p>
              <h1 className='mt-4 max-w-4xl text-[2.1rem] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-5xl lg:text-[3.8rem]'>
                {title}
              </h1>
            </div>
            <div className='grid gap-5 border-t border-[var(--app-border)] pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0'>
              <p className='max-w-xl text-[0.98rem] leading-7 text-[var(--app-muted)] sm:text-lg sm:leading-8'>
                {description}
              </p>
              <Link
                href='/map'
                className='group inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-[var(--app-primary)] px-5 text-sm font-semibold text-[var(--app-on-primary)] transition hover:bg-[var(--app-primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-focus)]'
              >
                <MapPinned aria-hidden='true' className='size-4' strokeWidth={1.8} />
                지도에서 행사 찾기
                <ArrowUpRight
                  aria-hidden='true'
                  className='size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5'
                  strokeWidth={1.8}
                />
              </Link>
            </div>
          </div>
        </section>
        <section className='grid gap-8'>{children}</section>
      </div>
    </div>
  );
};

export default InfoPageShell;
