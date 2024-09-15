import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import styles from './SearchBar.module.scss';
import { setSearchQuery } from '@/slices/culturesSlice'; // 검색 쿼리 설정 액션 import

interface SearchBarProps {
  onSearchClick: () => void;
}

const SearchBar = ({ onSearchClick }: SearchBarProps) => {
  const dispatch = useDispatch();
  const { resolvedTheme } = useTheme();
  const [searchQuery, setSearchQueryState] = useState<string>('');

  const searchIconSrc = resolvedTheme === 'dark' ? '/assets/search-icon-dark.svg' : '/assets/search-icon-light.svg';

  // 검색 처리 함수 (useCallback으로 메모이제이션)
  const handleSearch = useCallback(() => {
    dispatch(setSearchQuery(searchQuery));
  }, [dispatch, searchQuery]);

  // 폼 제출 핸들러
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // 기본 폼 제출 방지
    handleSearch(); // 검색 실행
    onSearchClick(); // onSearchClick 호출
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
      <button
        type='submit' // 폼 제출 버튼
        className={styles['search-btn']}
      >
        <Image src={searchIconSrc} width={24} height={24} alt='search_icon' priority />
      </button>
    </form>
  );
};

export default SearchBar;
