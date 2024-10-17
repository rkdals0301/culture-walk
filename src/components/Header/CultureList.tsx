import { FormattedCulture } from '@/types/culture';

import React, { useRef } from 'react';

import dynamic from 'next/dynamic';

import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';

// TODO: 스켈레톤 UI 작업
const CultureItem = dynamic(() => import('@/components/Header/CultureItem'));

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
    estimateSize: () => 90,
  });

  return (
    <div ref={parentRef} className='rounded-lg bg-gray-100 dark:bg-neutral-800'>
      <div
        className='relative divide-y divide-gray-300 dark:divide-neutral-700'
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const culture = cultures[virtualItem.index]; // 현재 인덱스의 문화 정보
          const isFirst = virtualItem.index === 0;
          const isLast = virtualItem.index === cultures.length - 1;

          return (
            <div
              key={virtualItem.key} // 각 항목에 고유한 key 추가
              className='absolute size-full'
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              onClick={() => onItemClick(culture)}
            >
              <div
                className={clsx('size-full cursor-pointer px-4 py-3 hover:bg-gray-200 dark:hover:bg-neutral-700', {
                  'rounded-t-lg': isFirst, // 첫 번째 요소일 때 상단 둥근 모서리
                  'rounded-b-lg': isLast, // 마지막 요소일 때 하단 둥근 모서리
                })}
              >
                <CultureItem culture={culture} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CultureList;
