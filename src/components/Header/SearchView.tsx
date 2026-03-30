import IconButton from '@/components/Common/IconButton';
import Loader from '@/components/Loader/Loader';
import { setSearchQuery } from '@/slices/culturesSlice';

import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import dynamic from 'next/dynamic';

import ArrowBackIcon from '../../../public/assets/images/arrow-back-icon.svg';
import SearchBar from './SearchBar';

const SearchResultsOverlay = dynamic(() => import('@/components/Header/SearchResultsOverlay'), {
  loading: () => <Loader />,
});

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
    <div className='fixed inset-0 z-50 flex items-start justify-center px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8'>
      <div className='fixed inset-0 bg-[#081311]/55 backdrop-blur-sm' onClick={onClose} />

      <div className='surface-panel relative z-50 flex h-full w-full max-w-[1040px] flex-col overflow-hidden rounded-[32px] text-[var(--app-text)]'>
        <div className='border-b border-[var(--app-border)] px-4 py-4 sm:px-6 sm:py-6'>
          <div className='flex items-start gap-3 sm:gap-4'>
            <IconButton icon={<ArrowBackIcon />} ariaLabel='검색 결과 닫기' onClick={onClose} variant='secondary' />
            <div className='min-w-0 flex-1'>
              <p className='text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-[#1f765f] dark:text-[#8dc5b5]'>
                Search Seoul Culture
              </p>
              <h2 className='mt-1 text-2xl font-semibold tracking-[-0.04em] sm:text-[2rem]'>
                지금 열리는 문화산책을 찾아보세요
              </h2>
              <p className='mt-2 max-w-2xl text-sm text-[var(--app-muted)] sm:text-base'>
                공연명, 전시명, 축제명을 검색하고 결과를 지도 상세로 바로 열 수 있습니다.
              </p>
              <div className='mt-4 h-14 sm:h-16'>
                <SearchBar
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  onReset={handleReset}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          </div>
        </div>
        <div className='min-h-0 flex-1 p-4 sm:p-6'>
          <SearchResultsOverlay onClose={onClose} />
        </div>
      </div>
    </div>
  );
};

export default SearchView;
