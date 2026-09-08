'use client';

import { useEffect } from 'react';

const ServiceWorkerRegistration = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        if (!cancelled) {
          await registration.update();
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('PWA service worker registration failed.', error);
        }
      }
    };

    void register();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
};

export default ServiceWorkerRegistration;
