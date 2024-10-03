import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setSearchQuery } from '@/slices/culturesSlice'; // 검색 쿼리 설정 액션 import
import SearchCancelIcon from '../../../public/assets/search-cancel-icon.svg';
import SearchIcon from '../../../public/assets/search-icon.svg';
import IconButton from '@/components/Common/IconButton';

interface SearchBarProps {
  onSearchClick: () => void;
}

const SearchBar = ({ onSearchClick }: SearchBarProps) => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQueryState] = useState<string>('');

  // 검색 처리 함수 (useCallback으로 메모이제이션)
  const handleSearch = useCallback(() => {
    dispatch(setSearchQuery(searchQuery));
  }, [dispatch, searchQuery]);

  const handleReset = () => {
    setSearchQueryState(''); // 검색 입력 필드 초기화
    dispatch(setSearchQuery('')); // Redux 상태에서 검색 쿼리 초기화
  };

  // 폼 제출 핸들러
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // 기본 폼 제출 방지
    handleSearch(); // 검색 실행
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='relative flex size-full items-center rounded-md border border-gray-300 bg-gray-100 px-2 text-gray-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100'
    >
      <IconButton
        type='submit'
        icon={<SearchIcon />} // 아이콘 전달
        ariaLabel='검색' // 접근성 라벨
      />
      <input
        type='text'
        placeholder='문화행사명을 입력해보세요'
        className='mx-2 size-full text-sm placeholder:text-gray-400 focus:outline-none dark:placeholder:text-gray-500'
        value={searchQuery}
        onChange={e => setSearchQueryState(e.target.value)} // 상태 업데이트
        onFocus={onSearchClick}
      />
      {searchQuery.length > 0 && (
        <IconButton
          icon={<SearchCancelIcon />} // 아이콘 전달
          ariaLabel='검색어 초기화' // 접근성 라벨
          onClick={handleReset}
        />
      )}
    </form>
  );
};

export default SearchBar;
