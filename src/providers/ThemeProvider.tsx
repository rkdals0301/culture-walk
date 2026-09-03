'use client';

import React, { lazy, Suspense, useEffect, useState } from 'react';

const ClientThemeProvider = lazy(async () => {
  const { ThemeProvider } = await import('next-themes');
  return { default: ThemeProvider };
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <Suspense fallback={children}>
      <ClientThemeProvider enableSystem={true} attribute='class' defaultTheme='system' disableTransitionOnChange>
        {children}
      </ClientThemeProvider>
    </Suspense>
  );
};

export default ThemeProvider;
