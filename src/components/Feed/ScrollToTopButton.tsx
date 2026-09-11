'use client';

import React from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  visible: boolean;
  onClick: () => void;
  className?: string;
}

const ScrollToTopButton = ({
  visible,
  onClick,
  className = '',
}: ScrollToTopButtonProps) => {
  return (
    <button
      type='button'
      onClick={onClick}
      aria-label='맨 위로 스크롤'
      title='맨 위로 스크롤'
      className={`pointer-events-auto flex size-11 sm:size-12 items-center justify-center rounded-full border border-[var(--color-border-primary)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] shadow-md transition-all duration-200 hover:bg-[var(--color-surface-secondary)] hover:border-[var(--color-border-control)] active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] ${
        visible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-3 opacity-0 pointer-events-none'
      } ${className}`}
    >
      <ArrowUp className='size-5 text-[var(--color-text-primary)]' strokeWidth={2.2} />
    </button>
  );
};

export default React.memo(ScrollToTopButton);
