'use client';

import React from 'react';

interface FeedSkeletonProps {
  count?: number;
}

const FeedSkeleton = ({ count = 10 }: FeedSkeletonProps) => {
  return (
    <div
      className='grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      aria-label='행사 정보를 불러오는 중입니다'
      aria-busy='true'
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className='flex flex-col animate-pulse'>
          {/* Poster placeholder */}
          <div className='relative aspect-[1/1.38] w-full rounded-xl bg-[var(--color-surface-chip)]' />

          {/* Text placeholder */}
          <div className='mt-2.5 flex flex-col gap-1.5'>
            {/* Category & Region shimmer */}
            <div className='h-3 w-1/3 rounded-sm bg-[var(--color-surface-chip)]' />

            {/* Title shimmer (2 lines) */}
            <div className='h-4 w-4/5 rounded-sm bg-[var(--color-surface-chip)]' />
            <div className='h-4 w-3/5 rounded-sm bg-[var(--color-surface-chip)]' />

            {/* Metadata lines shimmer */}
            <div className='mt-1 space-y-1'>
              <div className='h-3 w-1/2 rounded-sm bg-[var(--color-surface-chip)]' />
              <div className='h-3 w-2/3 rounded-sm bg-[var(--color-surface-chip)]' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(FeedSkeleton);
