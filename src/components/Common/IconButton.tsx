import React from 'react';

import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface IconButtonProps {
  icon: React.ReactNode; // 아이콘을 위한 React 노드
  ariaLabel: string; // 버튼의 접근성 라벨
  type?: 'button' | 'submit' | 'reset'; // 버튼 타입
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'gradient'; // 스타일 변형
  fullWidth?: boolean; // 전체 너비 여부
  disabled?: boolean; // 비활성화 여부
  onClick?: () => void; // 클릭 핸들러
  iconClassName?: string; // 아이콘에 적용할 클래스 이름
  className?: string; // 버튼에 적용할 추가 클래스 이름
}

const IconButton = ({
  icon,
  ariaLabel,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  onClick,
  iconClassName,
  className,
  ...props
}: IconButtonProps) => {
  const baseClass =
    'inline-flex items-center justify-center rounded-2xl border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f765f]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

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

  const colorClass = colorClasses[variant];

  const iconColorClass = 'text-current'; // 기본 아이콘 색상
  const iconSizeClass = 'size-5 sm:size-6'; // 아이콘 크기
  const buttonClass = twMerge(
    clsx(baseClass, colorClass, disabledClass, fullWidth ? 'w-full' : 'size-11', className)
  );

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      className={buttonClass}
      disabled={disabled}
      {...props}
    >
      <span className={twMerge(clsx(iconSizeClass, iconColorClass), iconClassName)}>{icon}</span>
    </button>
  );
};

export default IconButton;
