import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import styles from './SearchBar.module.scss';
import { setSearchQuery } from '@/slices/culturesSlice'; // 검색 쿼리 설정 액션 import
import { debounce } from 'lodash';

interface SearchBarProps {
  onSearchClick: () => void;
}

const SearchBar = ({ onSearchClick }: SearchBarProps) => {
  const dispatch = useDispatch();
  const { resolvedTheme } = useTheme();
  const [searchQuery, setSearchQueryState] = useState<string>('');

  const searchIconSrc = resolvedTheme === 'dark' ? '/assets/search-icon-dark.svg' : '/assets/search-icon-light.svg';

  // 디바운스된 검색 핸들러 생성
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      dispatch(setSearchQuery(query));
    }, 300),
    [dispatch]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQueryState(query); // 상태 업데이트
    debouncedSearch(query); // 디바운스된 검색 쿼리 호출
  };

  return (
    <div className={styles['search-bar-wrapper']}>
      <input
        type='text'
        placeholder='문화행사명을 입력해보세요'
        className={styles['search-bar']}
        value={searchQuery}
        onChange={handleSearchChange}
        onFocus={onSearchClick}
      />
      <button type='button' className={styles['search-btn']}>
        <Image src={searchIconSrc} width={24} height={24} alt='search_icon' priority />
      </button>
    </div>
  );
};

export default SearchBar;
