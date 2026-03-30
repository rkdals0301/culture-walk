import React from 'react';

import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'gradient';
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
    'inline-flex items-center justify-center rounded-2xl border font-semibold tracking-[-0.01em] transition duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f765f]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
    disabled && 'cursor-not-allowed opacity-50'
  );

  const colorClasses = {
    primary:
      'border-transparent bg-[#1f765f] text-[#fff8f1] shadow-[0_20px_40px_-24px_rgba(31,118,95,0.95)] hover:bg-[#175846]',
    secondary:
      'border-[var(--app-border)] bg-white/70 text-[var(--app-text)] hover:bg-white dark:bg-white/5 dark:hover:bg-white/10',
    success:
      'border-transparent bg-[#d98b2f] text-[#fff8f1] shadow-[0_20px_40px_-24px_rgba(217,139,47,0.9)] hover:bg-[#c17824]',
    danger:
      'border-transparent bg-[#8e3b34] text-[#fff8f1] shadow-[0_20px_40px_-24px_rgba(142,59,52,0.9)] hover:bg-[#733029]',
    gradient:
      'border-transparent bg-gradient-to-r from-[#1f765f] via-[#2b8a6e] to-[#d98b2f] text-[#fff8f1] hover:brightness-105',
  };

  const disabledColorClasses = {
    primary: 'border-transparent bg-[#8bb8ab] text-[#eef4f1]',
    secondary: 'border-[var(--app-border)] bg-white/40 text-[var(--app-muted)] dark:bg-white/5',
    success: 'border-transparent bg-[#d5a56f] text-[#fff8f1]',
    danger: 'border-transparent bg-[#b7847f] text-[#fff8f1]',
    gradient: 'border-transparent bg-[#8bb8ab] text-[#eef4f1]',
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
