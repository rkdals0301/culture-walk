'use client';

import { useEffect } from 'react';

const ClientReadyMarker = () => {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.appHydrated = 'true';
    return () => {
      delete root.dataset.appHydrated;
    };
  }, []);

  return null;
};

export default ClientReadyMarker;
