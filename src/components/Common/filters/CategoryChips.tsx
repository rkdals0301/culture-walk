'use client';

import { CULTURE_CATEGORY_OPTIONS, type CultureCategoryKey } from '@/utils/cultureCategory';
import clsx from 'clsx';

interface CategoryChipsProps {
  selected: CultureCategoryKey;
  onSelect: (category: CultureCategoryKey) => void;
  layout?: 'scroll' | 'grid';
  size?: 'sm' | 'md';
}

export const CategoryChips = ({ selected, onSelect, layout = 'scroll', size = 'md' }: CategoryChipsProps) => (
  <div
    className={clsx(
      layout === 'scroll' ? 'flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none' : 'grid grid-cols-5 gap-1.5'
    )}
    role='tablist'
    aria-label='문화행사 카테고리'
  >
    {CULTURE_CATEGORY_OPTIONS.map(option => {
      const isSelected = selected === option.key;
      return (
        <button
          type='button'
          key={option.key}
          role='tab'
          aria-selected={isSelected}
          onClick={() => onSelect(option.key)}
          className={clsx(
            'flex shrink-0 items-center justify-center rounded-full font-bold transition-all duration-150 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]',
            size === 'sm'
              ? 'h-8 px-1.5 text-[0.72rem]'
              : 'h-8.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm',
            isSelected
              ? 'bg-[var(--color-brand-primary)] text-white shadow-xs'
              : 'border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]'
          )}
        >
          <span className='truncate'>{option.label}</span>
        </button>
      );
    })}
  </div>
);
