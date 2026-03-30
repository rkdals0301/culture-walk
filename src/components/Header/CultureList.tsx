import CultureItemSkeleton from '@/components/Header/CultureItemSkeleton';
import { FormattedCulture } from '@/types/culture';

import React, { useRef } from 'react';

import dynamic from 'next/dynamic';

import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';

const CultureItem = dynamic(() => import('@/components/Header/CultureItem'), {
  loading: () => <CultureItemSkeleton />,
});

interface CultureListProps {
  cultures: FormattedCulture[];
  onItemClick: (culture: FormattedCulture) => void;
}

const CultureList = ({ cultures, onItemClick }: CultureListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const itemCount = cultures.length;

  const rowVirtualizer = useVirtualizer({
    count: itemCount, // 총 아이템 수
    overscan: 10,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 136,
  });

  return (
    <div ref={parentRef} className='h-full overflow-y-auto pr-1'>
      <div
        className='relative'
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const culture = cultures[virtualItem.index]; // 현재 인덱스의 문화 정보
          const isFirst = virtualItem.index === 0;
          const isLast = virtualItem.index === cultures.length - 1;

          return (
            <button
              type='button'
              key={virtualItem.key}
              className='absolute left-0 right-0 text-left'
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              onClick={() => onItemClick(culture)}
            >
              <div
                className={clsx(
                  'surface-card mx-1 my-2 h-[calc(100%-16px)] rounded-[28px] px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#1f765f]/20 hover:shadow-[0_24px_48px_-30px_rgba(31,118,95,0.5)]',
                  {
                    'mt-1': isFirst,
                    'mb-1': isLast,
                  }
                )}
              >
                <CultureItem culture={culture} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CultureList;
