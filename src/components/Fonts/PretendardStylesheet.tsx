'use client';

import { useEffect } from 'react';

const PRETENDARD_STYLESHEET_URL =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
const PRETENDARD_STYLESHEET_ID = 'pretendard-stylesheet';

/**
 * Preload the font manifest without putting its third-party stylesheet on the
 * critical rendering path. The stylesheet is attached after hydration and
 * uses font-display: swap, so the system fallback can paint immediately.
 */
const PretendardStylesheet = () => {
  useEffect(() => {
    if (document.getElementById(PRETENDARD_STYLESHEET_ID)) return;

    const stylesheet = document.createElement('link');
    stylesheet.id = PRETENDARD_STYLESHEET_ID;
    stylesheet.rel = 'stylesheet';
    stylesheet.href = PRETENDARD_STYLESHEET_URL;
    stylesheet.crossOrigin = 'anonymous';
    document.head.appendChild(stylesheet);

    return () => {
      stylesheet.remove();
    };
  }, []);

  return (
    <link
      rel='preload'
      href={PRETENDARD_STYLESHEET_URL}
      as='style'
      crossOrigin='anonymous'
    />
  );
};

export default PretendardStylesheet;
