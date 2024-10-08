import IconButton from '@/components/Common/IconButton';
import SearchResultsOverlay from '@/components/Header/SearchResultsOverlay';
import { setSearchQuery } from '@/slices/culturesSlice';

import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import ArrowBackIcon from '../../../public/assets/arrow-back-icon.svg';
import SearchBar from './SearchBar';

interface SearchViewProps {
  onClose: () => void;
}

const SearchView = ({ onClose }: SearchViewProps) => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQueryState] = useState<string>('');

  const handleSearch = useCallback(() => {
    dispatch(setSearchQuery(searchQuery));
  }, [dispatch, searchQuery]);

  const handleReset = useCallback(() => {
    setSearchQueryState('');
    dispatch(setSearchQuery(''));
  }, [dispatch]);

  useEffect(() => {
    handleReset();
  }, [handleReset]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSearch();
  };

  const handleSearchChange = (query: string) => {
    setSearchQueryState(query);
  };

  return (
    <div className='fixed left-0 top-0 z-20 flex size-full flex-col bg-white dark:bg-neutral-900'>
      <div className='flex h-14 flex-none items-center gap-2 border-b border-b-gray-300 px-4 py-2 dark:border-b-neutral-700'>
        <IconButton icon={<ArrowBackIcon />} ariaLabel='검색 결과 닫기' onClick={onClose} />
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onReset={handleReset}
          onSubmit={handleSubmit}
        />
      </div>
      <div className='h-[calc(100dvh-4rem)] grow'>
        <SearchResultsOverlay onClose={onClose} />
      </div>
    </div>
  );
};

export default SearchView;
