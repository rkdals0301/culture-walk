const CultureListLoading = () => {
  return (
    <div className='h-full overflow-y-auto pr-1'>
      <div>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`culture-loading-${index}`} className='animate-pulse border-b border-[var(--color-border-primary)] px-4 py-3'>
            <div className='flex min-h-[104px] items-center gap-3'>
              <div className='h-24 w-[72px] flex-none rounded-lg bg-[var(--color-surface-chip)]' />
              <div className='min-w-0 flex-1 space-y-2'>
                <div className='h-5 w-24 rounded-md bg-[var(--color-surface-chip)]' />
                <div className='h-4 w-4/5 rounded-full bg-[var(--color-surface-chip)]' />
                <div className='h-4 w-3/5 rounded-full bg-[var(--color-surface-chip)]' />
                <div className='h-3 w-3/5 rounded-full bg-[var(--color-surface-chip)]' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CultureListLoading;
