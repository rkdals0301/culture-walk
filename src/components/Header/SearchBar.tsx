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
      className='surface-card relative flex min-h-[3.25rem] w-full items-center gap-2 rounded-2xl px-2.5 py-2 text-[var(--app-text)] sm:min-h-[3.65rem] sm:px-3'
    >
      <label htmlFor='culture-search-input' className='sr-only'>
        문화행사 검색
      </label>
      <div className='flex min-w-0 flex-1 items-center gap-3'>
        <span className='flex size-10 flex-none items-center justify-center rounded-xl bg-[var(--app-primary)] text-[var(--app-on-primary)] shadow-[0_12px_26px_-22px_rgba(31,118,95,0.68)] sm:size-11'>
          <SearchIcon className='size-[18px] sm:size-5' />
        </span>
        <input
          id='culture-search-input'
          name='query'
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
      {searchQuery.length > 0 && (
        <IconButton
          icon={<SearchCancelIcon />}
          ariaLabel='검색어 초기화'
          onClick={onReset}
          variant='secondary'
          className='size-10 shrink-0 sm:size-11'
          iconClassName='size-[18px] sm:size-5'
        />
      )}
    </form>
  );
};

export default SearchBar;
