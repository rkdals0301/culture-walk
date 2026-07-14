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
    if (!mounted) {
      return;
    }

    const themeColor = isDark ? '#111614' : '#f3f5f2';
    document.querySelectorAll<HTMLMetaElement>("meta[name='theme-color']").forEach(meta => {
      meta.content = themeColor;
    });
  }, [isDark, mounted]);

  const handleClick = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <IconButton
      ariaLabel={isDark ? '라이트모드로 전환' : '다크모드로 전환'}
      onClick={handleClick}
      icon={isDark ? <LightModeIcon /> : <DarkModeIcon />}
    />
  );
};

export default ThemeToggle;
