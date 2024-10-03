import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FormattedCulture } from '@/types/culture';
import CultureItem from './CultureItem';

interface CultureListProps {
  cultures: FormattedCulture[];
  onItemClick: (culture: FormattedCulture) => void;
}

const CultureList = ({ cultures, onItemClick }: CultureListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const itemCount = cultures.length;

  const rowVirtualizer = useVirtualizer({
    count: itemCount, // 총 아이템 수
    getScrollElement: () => parentRef.current,
    estimateSize: () => 139, // 각 카드의 예상 높이 설정
  });

  return (
    <div ref={parentRef} className='grid h-full overflow-auto bg-white p-2 dark:bg-neutral-900'>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
        className='relative'
      >
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const culture = cultures[virtualItem.index]; // 현재 인덱스의 문화 정보
          return (
            <div
              key={virtualItem.key} // 각 항목에 고유한 key 추가
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className='absolute w-full'
              onClick={() => onItemClick(culture)}
            >
              <div className='w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-100 p-2 hover:bg-gray-200 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700'>
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
