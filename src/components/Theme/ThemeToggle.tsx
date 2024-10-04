'use client';

import Toggle from '@/components/Common/Toggle';

import React, { useEffect } from 'react';

import { useTheme } from 'next-themes';

// Toggle 컴포넌트 임포트

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
    if (metaThemeColor) {
      metaThemeColor.content = resolvedTheme === 'dark' ? '#171717' : '#ffffff';
    }
  }, [resolvedTheme]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTheme(event.target.checked ? 'dark' : 'light');
  };

  return (
    <Toggle id='theme-toggle' ariaLabel='다크모드 토글' checked={resolvedTheme === 'dark'} onChange={handleChange} />
  );
};

export default ThemeToggle;