'use client';

import { CSSProperties, useEffect } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface GoogleAdSlotProps {
  slot?: string;
  className?: string;
  style?: CSSProperties;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
}

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

const GoogleAdSlot = ({
  slot,
  className,
  style,
  format = 'auto',
  responsive = true,
}: GoogleAdSlotProps) => {
  useEffect(() => {
    if (!ADSENSE_CLIENT_ID || !slot) {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.error('Adsense render failed:', error);
    }
  }, [slot]);

  if (!ADSENSE_CLIENT_ID || !slot) {
    return null;
  }

  return (
    <ins
      className={`adsbygoogle block ${className ?? ''}`}
      style={{ display: 'block', ...style }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
      data-adtest={process.env.NODE_ENV === 'development' ? 'on' : undefined}
    />
  );
};

export default GoogleAdSlot;
