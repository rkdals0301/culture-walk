'use client';

import clsx from 'clsx';
import { Compass, RotateCcw, Ticket } from 'lucide-react';
import type React from 'react';

interface FreeOnlyToggleProps {
  isFreeOnly: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
}

export const FreeOnlyToggle = ({ isFreeOnly, onToggle, size = 'md' }: FreeOnlyToggleProps) => (
  <button
    type='button'
    onClick={onToggle}
    aria-pressed={isFreeOnly}
    className={clsx(
      'flex shrink-0 items-center gap-1.5 rounded-xl border font-bold transition-all active:scale-95',
      size === 'sm' ? 'h-8 px-2 text-[0.72rem]' : 'h-8 sm:h-9 px-3 text-xs',
      isFreeOnly
        ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)] shadow-xs'
        : 'border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:text-[var(--color-text-primary)]'
    )}
  >
    <Ticket className='size-3.5' strokeWidth={2} />
    <span>무료만</span>
  </button>
);

interface LocationToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive: boolean;
  isLocating: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md';
  compact?: boolean;
}

export const LocationToggle = ({
  isActive,
  isLocating,
  onToggle,
  size = 'md',
  compact = false,
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  title,
  ...rest
}: LocationToggleProps) => {
  const defaultLabel = isLocating ? '위치 확인 취소' : isActive ? '내 주변 해제' : '내 위치';
  const effectiveLabel = ariaLabel ?? defaultLabel;

  return (
    <button
      type='button'
      onClick={onToggle}
      disabled={isLocating}
      aria-pressed={ariaPressed ?? isActive}
      aria-label={effectiveLabel}
      title={title ?? effectiveLabel}
      {...rest}
      className={clsx(
        'flex shrink-0 items-center justify-center rounded-xl border font-bold transition-all active:scale-95',
        size === 'sm' ? 'h-8 px-2.5 text-[0.72rem] gap-1' : 'h-8 sm:h-9 px-3 text-xs gap-1.5',
        compact && 'px-2',
        isActive
          ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-subtle)] text-[var(--color-brand-primary)] shadow-xs'
          : 'border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-control)] hover:text-[var(--color-text-primary)]',
        isLocating &&
          'cursor-pointer border-[var(--color-disabled-border)] bg-[var(--color-interactive-disabled)] text-[var(--color-text-disabled)]'
      )}
    >
      <Compass
        className={clsx('size-3.5', isLocating && 'animate-spin text-[var(--color-brand-primary)]')}
        strokeWidth={2}
      />
      {!compact && <span>{isLocating ? '확인 중...' : isActive ? '내 주변' : '내 위치'}</span>}
    </button>
  );
};

interface ResetFiltersButtonProps {
  onReset: () => void;
  size?: 'sm' | 'md';
}

export const ResetFiltersButton = ({ onReset, size = 'md' }: ResetFiltersButtonProps) => (
  <button
    type='button'
    onClick={onReset}
    className={clsx(
      'flex shrink-0 items-center gap-1 rounded-xl font-bold text-[var(--color-brand-primary)] transition-colors hover:bg-[var(--color-surface-chip)] active:scale-95',
      size === 'sm' ? 'h-8 px-2 text-[0.72rem]' : 'h-8 sm:h-9 px-2.5 text-xs'
    )}
    aria-label='필터 조건 초기화'
  >
    <RotateCcw className='size-3' />
    <span>초기화</span>
  </button>
);
