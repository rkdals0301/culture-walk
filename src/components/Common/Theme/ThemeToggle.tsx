'use client';

import React, { useEffect } from 'react';
import { useTheme } from 'next-themes';
import styles from './ThemeToggle.module.scss';

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
    if (metaThemeColor) {
      metaThemeColor.content = resolvedTheme === 'dark' ? '#1e1e1e' : '#f5f5f5';
    }
  }, [resolvedTheme]);

  return (
    <button
      type='button'
      className={styles['theme-toggle-button']}
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      {resolvedTheme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
};

export default ThemeToggle;
