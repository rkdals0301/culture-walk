'use client';

import { useTheme } from 'next-themes';
import styles from './ThemeToggle.module.scss';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button type='button' className={styles.button} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
};

export default ThemeToggle;
