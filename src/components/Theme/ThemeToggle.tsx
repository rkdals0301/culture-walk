'use client';

import React, { useEffect } from 'react';
import { useTheme } from 'next-themes';
import Toggle from '@/components/Common/Toggle'; // Toggle 컴포넌트 임포트

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
    if (metaThemeColor) {
      metaThemeColor.content = resolvedTheme === 'dark' ? '#1e1e1e' : '#ffffff';
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
