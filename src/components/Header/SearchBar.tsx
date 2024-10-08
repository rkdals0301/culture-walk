import IconButton from '@/components/Common/IconButton';

import React from 'react';

import SearchCancelIcon from '../../../public/assets/search-cancel-icon.svg';
import SearchIcon from '../../../public/assets/search-icon.svg';

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
      className='relative flex size-full items-center rounded-full border border-gray-300 bg-gray-100 px-3 text-gray-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100'
    >
      <SearchIcon className='size-5' />
      <input
        type='text'
        placeholder='문화행사명을 입력해보세요'
        className='mx-2 size-full text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500'
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
      />
      {searchQuery.length > 0 && (
        <IconButton icon={<SearchCancelIcon />} ariaLabel='검색어 초기화' onClick={onReset} iconClassName='size-5' />
      )}
    </form>
  );
};

export default SearchBar;
