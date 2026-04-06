import CultureItemSkeleton from '@/components/Header/CultureItemSkeleton';
import { FormattedCulture } from '@/types/culture';

import React, { useEffect, useMemo, useRef } from 'react';

import dynamic from 'next/dynamic';

import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';

const CultureItem = dynamic(() => import('@/components/Header/CultureItem'), {
  loading: () => <CultureItemSkeleton />,
});

interface CultureListProps {
  cultures: FormattedCulture[];
  onItemClick: (culture: FormattedCulture) => void;
  selectedCultureId?: number | null;
}

const CultureList = ({ cultures, onItemClick, selectedCultureId = null }: CultureListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const itemCount = cultures.length;
  const selectedIndex = useMemo(() => {
    if (selectedCultureId == null) {
      return -1;
    }
    return cultures.findIndex(culture => culture.id === selectedCultureId);
  }, [cultures, selectedCultureId]);

  const rowVirtualizer = useVirtualizer({
    count: itemCount,
    overscan: 8,
    getScrollElement: () => parentRef.current,
    getItemKey: index => cultures[index]?.id ?? index,
    // Card content can be 1~2 lines, so measure real row height to avoid overlap.
    measureElement: element => element?.getBoundingClientRect().height ?? 0,
    estimateSize: () => 168,
  });

  useEffect(() => {
    if (selectedIndex < 0) {
      return;
    }

    rowVirtualizer.scrollToIndex(selectedIndex, { align: 'center' });
  }, [rowVirtualizer, selectedIndex]);

  return (
    <div ref={parentRef} className='h-full overflow-y-auto pr-1'>
      <div
        className='relative'
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const culture = cultures[virtualItem.index];
          const isSelected = selectedCultureId != null && culture.id === selectedCultureId;
          const isFirst = virtualItem.index === 0;
          const isLast = virtualItem.index === cultures.length - 1;

          return (
            <button
              type='button'
              key={virtualItem.key}
              ref={rowVirtualizer.measureElement}
              data-index={virtualItem.index}
              className={clsx('absolute left-0 right-0 px-1 text-left', {
                'pt-1': isFirst,
                'pb-1': isLast,
              })}
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
              onClick={() => onItemClick(culture)}
              aria-current={isSelected ? 'true' : undefined}
            >
              <div
                className={clsx(
                  'surface-card relative mb-2 rounded-[28px] px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#1f765f]/20 hover:shadow-[0_24px_48px_-30px_rgba(31,118,95,0.5)]',
                  {
                    'mt-1': isFirst,
                    'mb-0': isLast,
                    'border-[#1f765f]/55 bg-[#eaf5f1] shadow-[0_28px_56px_-34px_rgba(31,118,95,0.75)] ring-2 ring-[#1f765f]/35 dark:bg-[#10352d]': isSelected,
                  }
                )}
              >
                {isSelected && (
                  <span className='absolute right-4 top-4 z-10 inline-flex items-center rounded-full bg-[#1f765f] px-2.5 py-1 text-[0.64rem] font-semibold tracking-[0.08em] text-[#fff8f1] shadow-[0_10px_22px_-14px_rgba(31,118,95,0.9)] dark:bg-[#2f9b7d] dark:text-[#081311]'>
                    선택됨
                  </span>
                )}
                <CultureItem culture={culture} isSelected={isSelected} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CultureList;
