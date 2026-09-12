import CultureItem from '@/components/Header/CultureItem';
import { FormattedCultureListItem } from '@/types/culture';
import { GeoPoint } from '@/utils/geo';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import { ArrowUp } from 'lucide-react';

interface CultureListProps {
  cultures: FormattedCultureListItem[];
  onItemClick: (culture: FormattedCultureListItem) => void;
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
  const [showScrollTop, setShowScrollTop] = useState(false);
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

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    onScrollPositionChange?.(scrollTop);
    setShowScrollTop(scrollTop > 300);
  };

  const handleScrollToTop = () => {
    parentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    <div className='relative h-full'>
      <div
        ref={parentRef}
        className='h-full overflow-y-auto'
        onScroll={handleScroll}
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
      <button
        type='button'
        onClick={handleScrollToTop}
        aria-label='목록 맨 위로 스크롤'
        title='목록 맨 위로 스크롤'
        className={clsx(
          'pointer-events-auto absolute bottom-3 right-3 z-10 flex size-9 items-center justify-center rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] shadow-md transition-all duration-200 hover:bg-[var(--color-surface-secondary)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]',
          showScrollTop
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-2 opacity-0 pointer-events-none'
        )}
      >
        <ArrowUp className='size-4 text-[var(--color-text-primary)]' strokeWidth={2.2} />
      </button>
    </div>
  );
};

export default CultureList;
