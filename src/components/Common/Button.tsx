import React from 'react';

import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void; // 'onClick'을 선택적 속성으로 변경
}

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ariaLabel,
  disabled = false,
  className,
  onClick, // 기본 동작 설정
  ...props
}: ButtonProps) => {
  const baseClass = clsx(
    'inline-flex items-center justify-center rounded-xl border font-bold transition-all duration-150',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]',
    disabled && 'cursor-not-allowed opacity-100'
  );

  const colorClasses = {
    primary:
      'border-transparent bg-[var(--color-brand-primary)] text-[var(--color-brand-on-primary)] shadow-xs hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)]',
    secondary:
      'border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] hover:border-[var(--color-border-control)] hover:bg-[var(--color-surface-chip)] active:bg-[var(--color-interactive-active)]',
    success:
      'border-transparent bg-[var(--color-accent-primary)] text-[var(--color-accent-on-primary)] shadow-xs hover:bg-[var(--color-accent-hover)] active:bg-[var(--color-accent-active)]',
    danger:
      'border-transparent bg-[var(--color-error)] text-[var(--color-error-on-primary)] shadow-xs hover:bg-[var(--color-error-hover)] active:bg-[var(--color-error-hover)]',
  };

  const disabledColorClasses = {
    primary:
      'border-[var(--color-disabled-border)] bg-[var(--color-interactive-disabled)] text-[var(--color-text-disabled)] shadow-none',
    secondary:
      'border-[var(--color-disabled-border)] bg-[var(--color-interactive-disabled)] text-[var(--color-text-disabled)] shadow-none',
    success:
      'border-[var(--color-disabled-border)] bg-[var(--color-interactive-disabled)] text-[var(--color-text-disabled)] shadow-none',
    danger:
      'border-[var(--color-disabled-border)] bg-[var(--color-interactive-disabled)] text-[var(--color-text-disabled)] shadow-none',
  };

  const colorClass = disabled ? disabledColorClasses[variant] : colorClasses[variant];

  const sizeClasses = {
    sm: 'h-9 px-3 text-xs font-bold',
    md: 'h-11 px-4 text-xs sm:text-sm font-bold',
    lg: 'h-12 px-6 text-sm sm:text-base font-bold',
  };

  const sizeClass = sizeClasses[size];

  // clsx와 twMerge를 사용하여 클래스 병합
  const buttonClass = twMerge(clsx(baseClass, colorClass, sizeClass, fullWidth && 'w-full', className));

  return (
    <button
      type={type}
      onClick={disabled || !onClick ? undefined : onClick} // onClick이 없을 때 undefined 처리
      aria-label={ariaLabel}
      className={buttonClass}
      {...props}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
