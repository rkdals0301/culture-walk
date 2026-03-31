const CultureListLoading = () => {
  return (
    <div className='h-full overflow-y-auto pr-1'>
      <div className='grid gap-2.5 px-1 py-1'>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`culture-loading-${index}`}
            className='surface-card animate-pulse rounded-[24px] border-[var(--app-border)] p-4'
          >
            <div className='flex items-center gap-4'>
              <div className='h-24 w-20 flex-none rounded-[20px] bg-black/[0.07] dark:bg-white/[0.08]' />
              <div className='min-w-0 flex-1 space-y-2.5'>
                <div className='h-3 w-24 rounded-full bg-black/[0.07] dark:bg-white/[0.08]' />
                <div className='h-4 w-4/5 rounded-full bg-black/[0.07] dark:bg-white/[0.08]' />
                <div className='h-4 w-3/5 rounded-full bg-black/[0.07] dark:bg-white/[0.08]' />
                <div className='h-3 w-2/5 rounded-full bg-black/[0.07] dark:bg-white/[0.08]' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CultureListLoading;
