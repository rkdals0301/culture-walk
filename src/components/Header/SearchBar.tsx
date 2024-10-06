import IconButton from '@/components/Common/IconButton';
import SearchResultsOverlay from '@/components/Header/SearchResultsOverlay';
import { setSearchQuery } from '@/slices/culturesSlice';

import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import ArrowBackIcon from '../../../public/assets/arrow-back-icon.svg';
import SearchCancelIcon from '../../../public/assets/search-cancel-icon.svg';
import SearchIcon from '../../../public/assets/search-icon.svg';

interface SearchBarProps {
  onClose: () => void;
}

const SearchBar = ({ onClose }: SearchBarProps) => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQueryState] = useState<string>('');

  // 검색 처리 함수 (useCallback으로 메모이제이션)
  const handleSearch = useCallback(() => {
    dispatch(setSearchQuery(searchQuery));
  }, [dispatch, searchQuery]);

  const handleReset = useCallback(() => {
    setSearchQueryState(''); // 검색 입력 필드 초기화
    dispatch(setSearchQuery('')); // Redux 상태에서 검색 쿼리 초기화
  }, [dispatch]);

  useEffect(() => {
    handleReset();
  }, [handleReset]);

  // 폼 제출 핸들러
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // 기본 폼 제출 방지
    handleSearch(); // 검색 실행
  };

  const handleCloseOverlay = () => {
    onClose();
  };

  return (
    <div className='fixed left-0 top-0 z-20 flex size-full flex-col bg-white dark:bg-neutral-900'>
      <div className='flex h-14 flex-none items-center gap-4 border-b border-b-gray-300 px-4 py-2 dark:border-b-neutral-700'>
        <IconButton
          icon={<ArrowBackIcon />} // 아이콘 전달
          ariaLabel='검색 결과 닫기' // 접근성 라벨
          onClick={handleCloseOverlay} // 클릭 핸들러
          iconClassName='size-6'
        />
        <form
          onSubmit={handleSubmit}
          className='relative flex size-full items-center rounded-full border border-gray-300 bg-gray-100 px-3 text-gray-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100'
        >
          <SearchIcon className='size-5' />
          <input
            type='text'
            placeholder='문화행사명을 입력해보세요'
            className='mx-2 size-full text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500'
            value={searchQuery}
            onChange={e => setSearchQueryState(e.target.value)} // 상태 업데이트
          />
          {searchQuery.length > 0 && (
            <IconButton
              icon={<SearchCancelIcon />} // 아이콘 전달
              ariaLabel='검색어 초기화' // 접근성 라벨
              onClick={handleReset}
              iconClassName='size-5'
            />
          )}
        </form>
      </div>
      <div className='h-[calc(100dvh-4rem)] grow'>
        <SearchResultsOverlay onClose={handleCloseOverlay} />
      </div>
    </div>
  );
};

export default SearchBar;
