import CultureItem from '@/components/Header/CultureItem';
import { FormattedCulture } from '@/types/culture';
import { GeoPoint } from '@/utils/geo';

import React, { useEffect, useMemo, useRef } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';

interface CultureListProps {
  cultures: FormattedCulture[];
  onItemClick: (culture: FormattedCulture) => void;
  selectedCultureId?: number | null;
  currentLocation?: GeoPoint | null;
}

const CultureList = ({ cultures, onItemClick, selectedCultureId = null, currentLocation = null }: CultureListProps) => {
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
    estimateSize: () => 130,
  });

  useEffect(() => {
    if (selectedIndex < 0) {
      return;
    }

    rowVirtualizer.scrollToIndex(selectedIndex, { align: 'center' });
  }, [rowVirtualizer, selectedIndex]);

  return (
    <div ref={parentRef} className='h-full overflow-y-auto'>
      <div
        className='relative'
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const culture = cultures[virtualItem.index];
          const isSelected = selectedCultureId != null && culture.id === selectedCultureId;
          return (
            <button
              type='button'
              key={virtualItem.key}
              ref={rowVirtualizer.measureElement}
              data-index={virtualItem.index}
              className={clsx(
                'absolute left-0 right-0 px-1 text-left focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#d98b2f]/60'
              )}
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
              onClick={() => onItemClick(culture)}
              aria-current={isSelected ? 'true' : undefined}
            >
              <div
                className={clsx(
                  'relative border-b border-[var(--app-border)] px-3 py-3 transition-colors duration-150 hover:bg-black/[0.035] dark:hover:bg-white/[0.045]',
                  {
                    'bg-[#fff3e5] dark:bg-[#38291c]': isSelected,
                  }
                )}
              >
                {isSelected && (
                  <>
                    <span className='absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-[#d98b2f]' />
                    <span className='sr-only'>선택됨</span>
                  </>
                )}
                <CultureItem culture={culture} isSelected={isSelected} currentLocation={currentLocation} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CultureList;
