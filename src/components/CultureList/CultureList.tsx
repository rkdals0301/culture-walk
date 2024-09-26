import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FormattedCulture } from '@/types/culture';
import styles from './CultureList.module.scss';
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
    estimateSize: () => 130,
  });

  return (
    <div ref={parentRef} className={styles['culture-list-wrapper']}>
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map(virtualItem => {
          const culture = cultures[virtualItem.index]; // 현재 인덱스의 문화 정보
          return (
            <div
              key={virtualItem.key} // 각 항목에 고유한 key 추가
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                padding: `0.25rem 0`,
              }}
              className={styles['culture-item']}
              onClick={() => onItemClick(culture)}
            >
              <CultureItem culture={culture} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CultureList;
