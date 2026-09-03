import type { ReactNode } from 'react';

interface InfoPageShellProps {
  children: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

const InfoPageShell = ({ children, title, description, action }: InfoPageShellProps) => {
  return (
    <div className='info-page-scroll-shell h-full overflow-x-hidden overflow-y-auto bg-[var(--color-bg-primary)] px-4 pb-20 pt-24 text-[var(--color-text-primary)] sm:px-6 sm:pt-28 lg:px-10'>
      <div className='mx-auto grid w-full max-w-5xl gap-10 sm:gap-12 lg:gap-16'>
        <header className='info-page-intro border-b border-[var(--color-border-primary)] pb-8 sm:pb-10'>
          <div
            className={
              action
                ? 'grid gap-7 xl:grid-cols-[minmax(0,1fr)_minmax(16rem,0.6fr)] xl:items-end xl:gap-16'
                : 'max-w-3xl'
            }
          >
            <div>
              <h1 className='max-w-[18ch] text-[2rem] font-semibold leading-[1.08] tracking-[-0.05em] sm:text-5xl lg:text-[3.5rem] xl:text-[4rem]'>
                {title}
              </h1>
              <p className='mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg sm:leading-8'>
                {description}
              </p>
            </div>
            {action && <div className='pt-0 xl:border-l xl:border-[var(--color-border-primary)] xl:pl-8'>{action}</div>}
          </div>
        </header>
        <div className='grid gap-10 sm:gap-12'>{children}</div>
      </div>
    </div>
  );
};

export default InfoPageShell;
