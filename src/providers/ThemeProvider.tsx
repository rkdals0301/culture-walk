'use client';

import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  return (
    <NextThemesProvider enableSystem={true} attribute='class'>
      {children}
    </NextThemesProvider>
  );
};

export default ThemeProvider;
