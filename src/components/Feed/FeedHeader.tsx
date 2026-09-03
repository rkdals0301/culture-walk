'use client';

import React, { useEffect, useState } from 'react';

import { Search, X } from 'lucide-react';

interface FeedHeaderProps {
  totalCount: number;
  freeCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
}

const FeedHeader = ({
  totalCount,
  freeCount,
  searchQuery,
  onSearchChange,
  onClearSearch,
}: FeedHeaderProps) => {
  const [inputValue, setInputValue] = useState(searchQuery);

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearchChange(inputValue.trim());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onSearchChange(value);
  };

  const handleClear = () => {
    setInputValue('');
    onClearSearch();
  };

  return (
    <header className='mx-auto max-w-7xl px-4 pt-16 sm:pt-20 pb-2 sm:pb-3 lg:px-8'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-lg font-bold tracking-tight text-[var(--color-text-primary)] sm:text-xl'>
            행사 둘러보기
          </h1>
          <p className='mt-0.5 text-xs text-[var(--color-text-tertiary)]'>
            전국 {totalCount > 0 ? `${totalCount.toLocaleString('ko-KR')}개` : ''}
            {freeCount > 0 ? ` · 무료 ${freeCount.toLocaleString('ko-KR')}개` : ''}
          </p>
        </div>

        <div className='w-full sm:w-72 lg:w-80'>
          <form
            onSubmit={handleSubmit}
            className='relative flex h-10 items-center rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] px-3 text-xs sm:text-sm transition-all duration-150 focus-within:border-[var(--color-brand-primary)] focus-within:bg-[var(--color-surface-primary)] focus-within:ring-2 focus-within:ring-[var(--color-border-brand-subtle)]'
          >
            <label htmlFor='feed-search-input' className='sr-only'>
              문화행사 검색
            </label>
            <Search className='size-3.5 shrink-0 text-[var(--color-text-tertiary)]' strokeWidth={2} />
            <input
              id='feed-search-input'
              type='text'
              value={inputValue}
              onChange={handleInputChange}
              placeholder='행사명, 장소 검색'
              className='h-full flex-1 bg-transparent px-2.5 font-medium text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none'
              autoComplete='off'
              spellCheck={false}
            />
            {inputValue && (
              <button
                type='button'
                onClick={handleClear}
                className='flex size-5 shrink-0 items-center justify-center rounded-full text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)] transition-colors'
                aria-label='검색어 지우기'
              >
                <X className='size-3' />
              </button>
            )}
          </form>
        </div>
      </div>
    </header>
  );
};

export default React.memo(FeedHeader);
