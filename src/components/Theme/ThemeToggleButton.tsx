'use client';

import IconButton from '@/components/Common/IconButton';

import React, { useEffect } from 'react';

import { useTheme } from 'next-themes';

import DarkModeIcon from '../../../public/assets/images/dark-mode-icon.svg';
import LightModeIcon from '../../../public/assets/images/light-mode-icon.svg';

// 다크모드 아이콘

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
    if (metaThemeColor) {
      metaThemeColor.content = resolvedTheme === 'dark' ? '#171717' : '#ffffff';
    }
  }, [resolvedTheme]);

  const handleClick = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <IconButton
      ariaLabel='다크모드 토글'
      onClick={handleClick}
      icon={resolvedTheme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
    />
  );
};

export default ThemeToggle;
