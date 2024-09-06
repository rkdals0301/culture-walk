'use client';

import { useState, useEffect } from 'react';
import styles from '@/components/Common/Theme/ThemeToggle.module.scss';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isInitialRender, setIsInitialRender] = useState(true);

  // 초기 테마 설정
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark';

    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      const initialTheme = mediaQuery.matches ? 'dark' : 'light';
      setTheme(initialTheme);
      localStorage.setItem('theme', initialTheme);
    }

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
    if (isInitialRender) {
      setIsInitialRender(false);
      return;
    }

    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button className={styles.button} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? '다크' : '라이트'}
    </button>
  );
}
