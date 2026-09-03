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
  initialScrollTop?: number;
  onScrollPositionChange?: (scrollTop: number) => void;
}

const CultureList = ({
  cultures,
  onItemClick,
  selectedCultureId = null,
  currentLocation = null,
  initialScrollTop = 0,
  onScrollPositionChange,
}: CultureListProps) => {
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

  useEffect(() => {
    if (initialScrollTop <= 0) {
      return;
    }

    const restoreFrame = window.requestAnimationFrame(() => {
      if (parentRef.current) {
        parentRef.current.scrollTop = initialScrollTop;
      }
    });

    return () => window.cancelAnimationFrame(restoreFrame);
  }, [initialScrollTop]);

  return (
    <div
      ref={parentRef}
      className='h-full overflow-y-auto'
      onScroll={event => onScrollPositionChange?.(event.currentTarget.scrollTop)}
    >
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
              data-culture-id={culture.id}
              className={clsx(
                'group absolute left-0 right-0 px-2 py-1 text-left focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--color-focus-ring)]'
              )}
              style={{
                transform: `translateY(${virtualItem.start}px)`,
              }}
              onClick={() => onItemClick(culture)}
              aria-current={isSelected ? 'true' : undefined}
              aria-pressed={isSelected}
              aria-label={`${culture.title}, ${culture.displayDate}, ${culture.displayPlace}${isSelected ? ', 선택됨' : ''}`}
            >
              <div
                className={clsx(
                  'relative rounded-xl p-2.5 transition-colors duration-150',
                  isSelected
                    ? 'bg-[var(--color-brand-subtle)] ring-1 ring-[var(--color-brand-primary)]/40'
                    : 'hover:bg-[var(--color-surface-chip)]/70 active:bg-[var(--color-surface-chip)]'
                )}
              >
                {isSelected && (
                  <span className='sr-only'>선택됨</span>
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
