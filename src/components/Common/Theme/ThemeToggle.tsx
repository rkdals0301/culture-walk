'use client';

import { useState, useEffect } from 'react';
import styles from '@/components/Common/Theme/ThemeToggle.module.scss';

const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // 초기 테마 설정 및 미디어 쿼리 변화 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark';

    const initialTheme = storedTheme || (mediaQuery.matches ? 'dark' : 'light');
    setTheme(initialTheme);
    localStorage.setItem('theme', initialTheme);

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // 테마 변경 시 document와 localStorage 업데이트
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    // theme-color 메타 태그 업데이트
    const metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (metaThemeColor) {
      metaThemeColor.content = theme === 'light' ? '#FFFFFF' : '#000000'; // 다크 모드 색상
    }
  }, [theme]);

  return (
    <button className={styles.button} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? '다크' : '라이트'}
    </button>
  );
};

export default ThemeToggle;
