import IconButton from '@/components/Common/IconButton';

import React from 'react';

import SearchCancelIcon from '../../../public/assets/images/search-cancel-icon.svg';
import SearchIcon from '../../../public/assets/images/search-icon.svg';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onReset: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  autoFocus?: boolean;
}

const SearchBar = ({ searchQuery, onSearchChange, onReset, onSubmit, autoFocus = false }: SearchBarProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className='surface-card relative flex w-full min-h-[3.25rem] items-center gap-2 rounded-[22px] px-2.5 py-2 text-[var(--app-text)] sm:min-h-[3.65rem] sm:px-3'
    >
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        <span className='flex size-10 flex-none items-center justify-center rounded-2xl bg-[#1f765f] text-[#fff8f1] shadow-[0_18px_36px_-24px_rgba(31,118,95,0.95)] sm:size-11'>
          <SearchIcon className='size-[18px] sm:size-5' />
        </span>
        <input
          type='text'
          placeholder='행사명, 공연, 전시를 입력해보세요'
          className='h-full w-full bg-transparent text-[0.98rem] font-medium leading-6 placeholder:text-[var(--app-muted)] sm:text-base'
          value={searchQuery}
          autoFocus={autoFocus}
          autoComplete='off'
          spellCheck={false}
          enterKeyHint='search'
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <div className='flex items-center gap-1.5 sm:gap-2'>
        {searchQuery.length > 0 && (
          <IconButton
            icon={<SearchCancelIcon />}
            ariaLabel='검색어 초기화'
            onClick={onReset}
            variant='secondary'
            className='size-10 sm:size-11'
            iconClassName='size-[18px] sm:size-5'
          />
        )}
        <IconButton
          type='submit'
          icon={<SearchIcon />}
          ariaLabel='검색'
          className='size-10 sm:hidden'
          iconClassName='size-[18px]'
        />
        <button
          type='submit'
          className='hidden h-11 items-center justify-center rounded-xl bg-[#1f765f] px-3.5 text-sm font-semibold text-[#fff8f1] shadow-[0_16px_32px_-22px_rgba(31,118,95,0.95)] transition hover:bg-[#175846] sm:inline-flex'
        >
          검색
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
