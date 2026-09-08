'use client';

import IconButton from '@/components/Common/IconButton';
import { useTheme } from '@/providers/ThemeProvider';

import React, { useEffect, useState } from 'react';

import DarkModeIcon from '../../../public/assets/images/dark-mode-icon.svg';
import LightModeIcon from '../../../public/assets/images/light-mode-icon.svg';

// 다크모드 아이콘

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className }: ThemeToggleProps) => {
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

    const updateThemeColor = () => {
      const themeColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-bg-primary')
        .trim();
      if (!themeColor) {
        return;
      }

      document.querySelectorAll<HTMLMetaElement>("meta[name='theme-color']").forEach(meta => {
        meta.content = themeColor;
      });
    };

    updateThemeColor();
    const observer = new MutationObserver(updateThemeColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [mounted]);

  const handleClick = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <IconButton
      ariaLabel={isDark ? '라이트모드로 전환' : '다크모드로 전환'}
      title={isDark ? '라이트모드로 전환' : '다크모드로 전환'}
      onClick={handleClick}
      variant='secondary'
      className={className ?? 'size-9 sm:size-10 rounded-lg transition-colors hover:bg-[var(--color-surface-chip)]'}
      icon={isDark ? <LightModeIcon /> : <DarkModeIcon />}
    />
  );
};

export default ThemeToggle;
