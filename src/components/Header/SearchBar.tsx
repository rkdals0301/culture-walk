import IconButton from '@/components/Common/IconButton';

import React from 'react';

import SearchCancelIcon from '../../../public/assets/images/search-cancel-icon.svg';
import SearchIcon from '../../../public/assets/images/search-icon.svg';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onReset: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const SearchBar = ({ searchQuery, onSearchChange, onReset, onSubmit }: SearchBarProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className='surface-card relative flex size-full items-center gap-2 rounded-[24px] px-3 py-2 text-[var(--app-text)]'
    >
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        <span className='flex size-10 flex-none items-center justify-center rounded-2xl bg-[#1f765f] text-[#fff8f1] shadow-[0_18px_36px_-24px_rgba(31,118,95,0.95)]'>
          <SearchIcon className='size-5' />
        </span>
        <input
          type='text'
          placeholder='문화행사명, 공연, 전시를 검색해보세요'
          className='h-full w-full bg-transparent text-sm font-medium placeholder:text-[var(--app-muted)] sm:text-base'
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      <div className='flex items-center gap-2'>
        {searchQuery.length > 0 && (
          <IconButton icon={<SearchCancelIcon />} ariaLabel='검색어 초기화' onClick={onReset} variant='secondary' />
        )}
        <IconButton type='submit' icon={<SearchIcon />} ariaLabel='검색' />
      </div>
    </form>
  );
};

export default SearchBar;
