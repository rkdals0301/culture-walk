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
        className='safe-area-search-panel surface-panel pointer-events-auto relative z-50 flex w-full max-w-[1040px] flex-col overflow-hidden rounded-[24px] bg-[var(--color-surface-overlay)] text-[var(--color-text-primary)] shadow-2xl backdrop-blur-2xl'
        role='dialog'
        aria-modal='true'
        aria-label='문화행사 검색'
        tabIndex={-1}
      >
        <div className='border-b border-[var(--color-border-primary)] px-4 py-3.5 sm:px-6 sm:py-5'>
          <div className='flex items-center justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <h2 className='text-base font-bold tracking-tight text-[var(--color-text-primary)] sm:text-lg'>
                행사 검색
              </h2>
            </div>
            <IconButton
              icon={<CloseIcon />}
              ariaLabel='검색 결과 닫기'
              onClick={onClose}
              variant='secondary'
              className='size-9 shrink-0 sm:size-10'
              iconClassName='size-4 sm:size-[18px]'
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
