import IconButton from '@/components/Common/IconButton';
import Loader from '@/components/Loader/Loader';
import { useCultureContext } from '@/context/CultureContext';
import { useDialogFocusTrap } from '@/hooks/useDialogFocusTrap';

import React, { startTransition, useCallback, useDeferredValue, useEffect, useRef, useState } from 'react';

import dynamic from 'next/dynamic';

import CloseIcon from '../../../public/assets/images/close-icon.svg';
import SearchBar from './SearchBar';

const SearchResultsOverlay = dynamic(() => import('@/components/Header/SearchResultsOverlay'), {
  loading: () => <Loader />,
});

interface SearchViewProps {
  onClose: () => void;
  onCloseWithoutHistory: () => void;
}

const SearchView = ({ onClose, onCloseWithoutHistory }: SearchViewProps) => {
  const { searchQuery, setSearchQuery } = useCultureContext();
  const [searchInput, setSearchInput] = useState<string>(searchQuery);
  const deferredSearchInput = useDeferredValue(searchInput);
  const panelRef = useRef<HTMLDivElement>(null);

  useDialogFocusTrap(true, panelRef, onClose, 'input');

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
    applySearchQuery(deferredSearchInput);
  }, [applySearchQuery, deferredSearchInput]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applySearchQuery(searchInput);
  };

  const handleSearchChange = (query: string) => {
    setSearchInput(query);
  };

  return (
    <div className='safe-area-search-overlay pointer-events-auto fixed inset-0 z-50 flex items-stretch justify-center sm:items-start'>
      <div className='pointer-events-auto fixed inset-0 bg-[var(--color-overlay)] backdrop-blur-sm' onClick={onClose} />

      <div
        ref={panelRef}
        className='safe-area-search-panel surface-panel pointer-events-auto relative z-50 flex w-full max-w-[1040px] flex-col overflow-hidden rounded-[18px] bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)]'
        role='dialog'
        aria-modal='true'
        aria-label='문화행사 검색'
        tabIndex={-1}
      >
        <div className='border-b border-[var(--color-border-primary)] px-4 py-3.5 sm:px-6 sm:py-5'>
          <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <p className='text-[0.72rem] font-semibold text-[var(--color-brand-primary)]'>전국 문화행사 검색</p>
              <h2 className='mt-1 text-[1.3rem] font-semibold leading-[1.24] sm:text-[1.9rem]'>
                문화행사를 빠르게 검색하세요
              </h2>
              <p className='mt-1 hidden max-w-2xl text-[0.86rem] text-[var(--color-text-secondary)] sm:mt-1.5 sm:block sm:text-[0.96rem]'>
                입력과 동시에 결과가 업데이트됩니다. 항목을 누르면 지도 상세로 이동합니다.
              </p>
            </div>
            <IconButton
              icon={<CloseIcon />}
              ariaLabel='검색 결과 닫기'
              onClick={onClose}
              variant='secondary'
              className='size-10 shrink-0 sm:size-11'
              iconClassName='size-[18px] sm:size-5'
            />
          </div>
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
        <div className='min-h-0 flex-1 p-3 sm:p-5'>
          <SearchResultsOverlay onCloseWithoutHistory={onCloseWithoutHistory} onResetSearch={handleReset} />
        </div>
      </div>
    </div>
  );
};

export default SearchView;
