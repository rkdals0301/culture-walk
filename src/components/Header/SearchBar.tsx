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
    <form onSubmit={onSubmit} className='relative flex size-full items-center text-gray-900 dark:text-gray-100'>
      <input
        type='text'
        placeholder='문화행사명을 입력해보세요'
        className='mx-2 size-full placeholder:text-gray-400 dark:placeholder:text-gray-500'
        value={searchQuery}
        onChange={e => onSearchChange(e.target.value)}
      />
      <div className='flex h-full items-center justify-center gap-4'>
        {searchQuery.length > 0 && (
          <IconButton icon={<SearchCancelIcon />} ariaLabel='검색어 초기화' onClick={onReset} />
        )}
        <IconButton type='submit' icon={<SearchIcon />} ariaLabel='검색' />
      </div>
    </form>
  );
};

export default SearchBar;
