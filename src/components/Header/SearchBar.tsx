import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import clsx from 'clsx'; // clsx 추가
import styles from './SearchBar.module.scss';
import { setSearchQuery } from '@/slices/culturesSlice'; // 검색 쿼리 설정 액션 import
import SearchCancelIcon from '../../../public/assets/search-cancel-icon.svg';
import SearchIcon from '../../../public/assets/search-icon.svg';

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
    <form onSubmit={handleSubmit} className={styles['search-bar-wrapper']}>
      <input
        type='text'
        placeholder='문화행사명을 입력해보세요'
        className={styles['search-bar']}
        value={searchQuery}
        onChange={e => setSearchQueryState(e.target.value)} // 상태 업데이트
        onFocus={onSearchClick}
      />
      {searchQuery.length > 0 && (
        <button
          type='button'
          className={clsx('button', styles['search-reset-button'])} // clsx로 변경
          onClick={handleReset}
        >
          <SearchCancelIcon />
        </button>
      )}
      <button
        type='submit'
        className='button' // clsx로 단일 클래스 변경
      >
        <SearchIcon />
      </button>
    </form>
  );
};

export default SearchBar;
