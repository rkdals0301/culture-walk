import IconButton from '@/components/Common/IconButton';
import { useCultureContext } from '@/context/CultureContext';
import Loader from '@/components/Loader/Loader';

import React, { startTransition, useCallback, useDeferredValue, useEffect, useState } from 'react';

import dynamic from 'next/dynamic';

import ArrowBackIcon from '../../../public/assets/images/arrow-back-icon.svg';
import SearchBar from './SearchBar';

const SearchResultsOverlay = dynamic(() => import('@/components/Header/SearchResultsOverlay'), {
  loading: () => <Loader />,
});

interface SearchViewProps {
  onClose: () => void;
  onCloseWithoutHistory: () => void;
}

const SearchView = ({ onClose, onCloseWithoutHistory }: SearchViewProps) => {
  const { setSearchQuery } = useCultureContext();
  const [searchInput, setSearchInput] = useState<string>('');
  const deferredSearchInput = useDeferredValue(searchInput);

  const applySearchQuery = useCallback(
    (query: string) => {
      startTransition(() => {
        setSearchQuery(query);
      });
    },
    [setSearchQuery]
  );

  const handleReset = useCallback(() => {
    setSearchInput('');
    applySearchQuery('');
  }, [applySearchQuery]);

  useEffect(() => {
    handleReset();
  }, [handleReset]);

  useEffect(() => {
    applySearchQuery(deferredSearchInput);
  }, [applySearchQuery, deferredSearchInput]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applySearchQuery(searchInput);
  };

  const handleSearchChange = (query: string) => {
    setSearchInput(query);
  };

  return (
    <div className='pointer-events-auto fixed inset-0 z-50 flex items-stretch justify-center px-3 py-3 sm:items-start sm:px-6 sm:py-6 lg:px-8 lg:py-8'>
      <div className='pointer-events-auto fixed inset-0 bg-[#081311]/55 backdrop-blur-sm' onClick={onClose} />

      <div className='surface-panel pointer-events-auto relative z-50 flex h-[calc(100dvh-1.5rem)] w-full max-w-[1040px] flex-col overflow-hidden rounded-[24px] text-[var(--app-text)] sm:h-full sm:rounded-[32px]'>
        <div className='border-b border-[var(--app-border)] px-4 py-3.5 sm:px-6 sm:py-5'>
          <div className='flex items-center justify-between sm:hidden'>
            <IconButton
              icon={<ArrowBackIcon />}
              ariaLabel='검색 결과 닫기'
              onClick={onClose}
              variant='secondary'
              className='size-10'
              iconClassName='size-[18px]'
            />
            <button
              type='button'
              onClick={onClose}
              className='soft-chip rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--app-muted)]'
            >
              닫기
            </button>
          </div>

          <div className='mt-3 sm:mt-0 sm:flex sm:items-start sm:gap-4'>
            <IconButton
              icon={<ArrowBackIcon />}
              ariaLabel='검색 결과 닫기'
              onClick={onClose}
              variant='secondary'
              className='hidden sm:inline-flex'
            />
            <div className='min-w-0 flex-1'>
              <p className='text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#1f765f] dark:text-[#8dc5b5]'>
                Search Seoul Culture
              </p>
              <h2 className='mt-1 text-[1.3rem] font-semibold leading-[1.24] tracking-[-0.02em] sm:text-[1.9rem] sm:tracking-[-0.03em]'>
                문화행사를 빠르게 검색하세요
              </h2>
              <p className='mt-1 hidden max-w-2xl text-[0.86rem] text-[var(--app-muted)] sm:mt-1.5 sm:block sm:text-[0.96rem]'>
                입력과 동시에 결과가 업데이트됩니다. 항목을 누르면 지도 상세로 이동합니다.
              </p>
              <div className='mt-2.5 sm:mt-3'>
                <SearchBar
                  searchQuery={searchInput}
                  onSearchChange={handleSearchChange}
                  onReset={handleReset}
                  onSubmit={handleSubmit}
                  autoFocus
                />
              </div>
            </div>
          </div>
        </div>
        <div className='min-h-0 flex-1 p-3 sm:p-5'>
          <SearchResultsOverlay onClose={onClose} onCloseWithoutHistory={onCloseWithoutHistory} />
        </div>
      </div>
    </div>
  );
};

export default SearchView;
