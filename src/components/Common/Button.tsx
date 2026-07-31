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
    'inline-flex items-center justify-center rounded-xl border font-semibold transition duration-200',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-focus)]',
    disabled && 'cursor-not-allowed opacity-50'
  );

  const colorClasses = {
    primary:
      'border-transparent bg-[var(--app-primary)] text-[var(--app-on-primary)] shadow-[0_14px_30px_-24px_rgba(31,118,95,0.72)] hover:bg-[var(--app-primary-hover)]',
    secondary:
      'border-[var(--app-border)] bg-white/70 text-[var(--app-text)] hover:bg-white dark:bg-white/5 dark:hover:bg-white/10',
    success:
      'border-transparent bg-[var(--app-accent)] text-[var(--app-on-accent)] shadow-[0_14px_30px_-24px_rgba(217,139,47,0.66)] hover:bg-[var(--app-accent-hover)]',
    danger:
      'border-transparent bg-[var(--app-danger)] text-[var(--app-on-danger)] shadow-[0_14px_30px_-24px_rgba(142,59,52,0.66)] hover:bg-[var(--app-danger-hover)]',
  };

  const disabledColorClasses = {
    primary: 'border-transparent bg-[var(--app-primary)] text-[var(--app-on-primary)]',
    secondary: 'border-[var(--app-border)] bg-white/40 text-[var(--app-muted)] dark:bg-white/5',
    success: 'border-transparent bg-[var(--app-accent)] text-[var(--app-on-accent)]',
    danger: 'border-transparent bg-[var(--app-danger)] text-[var(--app-on-danger)]',
  };

  const colorClass = disabled ? disabledColorClasses[variant] : colorClasses[variant];

  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-sm sm:text-base',
    lg: 'h-12 px-6 text-base',
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
