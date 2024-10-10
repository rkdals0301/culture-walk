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
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* 반투명 배경 */}
      <div className='fixed inset-0 bg-black/50' onClick={onClose}></div>

      {/* 모달 컨텐츠 */}
      <div className='relative z-50 size-full bg-white dark:bg-neutral-900 md:h-175 md:w-192 md:rounded-lg md:shadow-lg'>
        <div className='flex h-14 items-center gap-4 border-b border-b-gray-300 px-4 py-2 dark:border-b-neutral-700'>
          <IconButton icon={<ArrowBackIcon />} ariaLabel='검색 결과 닫기' onClick={onClose} />
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onReset={handleReset}
            onSubmit={handleSubmit}
          />
        </div>
        {/* 모달 내용에 스크롤 처리 */}
        <div className='h-[calc(100%-7rem)]'>
          <SearchResultsOverlay onClose={onClose} />
        </div>
        <div className='h-14 items-center border-t border-t-gray-300 dark:border-t-neutral-700' />
      </div>
    </div>
  );
};

export default SearchView;
