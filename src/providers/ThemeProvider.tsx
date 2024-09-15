'use client';

import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <NextThemesProvider enableSystem={true} attribute='class'>
      {children}
    </NextThemesProvider>
  );
};

export default ThemeProvider;
