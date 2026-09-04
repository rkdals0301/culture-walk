'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = Exclude<Theme, 'system'>;
type ThemeSelection = Theme | ((theme: Theme) => Theme);

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  systemTheme: ResolvedTheme;
  themes: Theme[];
  setTheme: (theme: ThemeSelection) => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

const STORAGE_KEY = 'theme';
const themes: Theme[] = ['light', 'dark', 'system'];
const DEFAULT_SYSTEM_THEME: ResolvedTheme = 'light';

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return DEFAULT_SYSTEM_THEME;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system' ? storedTheme : 'system';
  } catch {
    return 'system';
  }
};

const applyTheme = (theme: ResolvedTheme) => {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
};

const defaultThemeContext: ThemeContextValue = {
  theme: 'system',
  resolvedTheme: DEFAULT_SYSTEM_THEME,
  systemTheme: DEFAULT_SYSTEM_THEME,
  themes,
  setTheme: () => undefined,
};

const ThemeContext = createContext<ThemeContextValue>(defaultThemeContext);

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());
  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const mediaQuery = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

    const updateSystemTheme = () => {
      setSystemTheme(getSystemTheme());
    };

    setThemeState(getStoredTheme());
    updateSystemTheme();

    if (!mediaQuery) {
      return undefined;
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateSystemTheme);
    } else {
      mediaQuery.addListener?.(updateSystemTheme);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', updateSystemTheme);
      } else {
        mediaQuery.removeListener?.(updateSystemTheme);
      }
    };
  }, []);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }

      setThemeState(
        event.newValue === 'light' || event.newValue === 'dark' || event.newValue === 'system'
          ? event.newValue
          : 'system'
      );
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const setTheme = useCallback((selection: ThemeSelection) => {
    setThemeState(currentTheme => {
      const nextTheme = typeof selection === 'function' ? selection(currentTheme) : selection;
      const next = themes.includes(nextTheme) ? nextTheme : 'system';

      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Theme preference is best effort when storage is unavailable.
      }

      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, systemTheme, themes, setTheme }),
    [resolvedTheme, setTheme, systemTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeProvider;
