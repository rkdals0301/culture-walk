'use client';

import React, { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMount, setMount] = useState(false);

  useEffect(() => {
    setMount(true);
  }, []);

  if (!isMount) {
    return null;
  }

  return (
    <NextThemesProvider enableSystem={true} attribute='class'>
      {children}
    </NextThemesProvider>
  );
};

export default ThemeProvider;
