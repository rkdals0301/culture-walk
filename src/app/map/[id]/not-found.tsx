import Link from 'next/link';

const NotFound = () => {
  return (
    <section className='flex size-full flex-col items-center justify-center gap-4'>
        <h1 className='text-3xl font-bold md:text-2xl'>페이지를 찾을 수 없습니다.</h1>
        <nav>
        <Link
          href='/'
          replace
          aria-label='홈으로'
          className='inline-flex h-11 items-center justify-center rounded-xl border border-transparent bg-[var(--color-brand-primary)] px-4 text-xs font-bold text-[var(--color-brand-on-primary)] shadow-xs transition-all duration-150 hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] sm:text-sm'
        >
          홈으로
        </Link>
      </nav>
    </section>
  );
};

export default NotFound;
