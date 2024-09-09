'use client';

import React, { useEffect } from 'react';
import { useTheme } from 'next-themes';
import styles from './ThemeToggle.module.scss';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
    if (!metaThemeColor) return;
    metaThemeColor.content = theme === 'dark' ? '#1e1e1e' : '#f5f5f5';
  }, [theme]);

  return (
    <button type='button' className={styles.button} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
};

export default ThemeToggle;
