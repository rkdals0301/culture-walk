'use client';

import IconButton from '@/components/Common/IconButton';

import React, { useEffect, useState } from 'react';

import { useTheme } from 'next-themes';

import DarkModeIcon from '../../../public/assets/images/dark-mode-icon.svg';
import LightModeIcon from '../../../public/assets/images/light-mode-icon.svg';

// 다크모드 아이콘

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
    if (metaThemeColor) {
      metaThemeColor.content = isDark ? '#081311' : '#f4efe7';
    }
  }, [isDark]);

  const handleClick = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <IconButton
      ariaLabel='다크모드 토글'
      onClick={handleClick}
      icon={isDark ? <LightModeIcon /> : <DarkModeIcon />}
    />
  );
};

export default ThemeToggle;
