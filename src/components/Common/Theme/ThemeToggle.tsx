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

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTheme(event.target.checked ? 'dark' : 'light');
  };

  return (
    <div className={styles['toggle-switch']}>
      <input
        className={styles['switch-input']}
        id='theme-toggle'
        type='checkbox'
        checked={resolvedTheme === 'dark'}
        onChange={handleChange}
      />
      <label htmlFor='theme-toggle' className={styles['switch-label']}>
        <span className={styles.slider}></span>
      </label>
    </div>
  );
};

export default ThemeToggle;
