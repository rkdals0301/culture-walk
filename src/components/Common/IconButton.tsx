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
  const baseClass = 'flex items-center justify-center rounded-full transition duration-200 p-2';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const colorClasses = {
    primary: 'hover:bg-gray-200 dark:hover:bg-neutral-700',
    secondary: 'hover:bg-gray-200 dark:hover:bg-neutral-700',
    success: 'hover:bg-gray-200 dark:hover:bg-neutral-700',
    danger: 'hover:bg-gray-200 dark:hover:bg-neutral-700',
    gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gray-200 dark:hover:bg-neutral-700',
  };

  const colorClass = colorClasses[variant];

  const iconColorClass = 'text-gray-900 dark:text-gray-100'; // 기본 아이콘 색상
  const iconSizeClass = 'size-6'; // 아이콘 크기
  const buttonClass = twMerge(clsx(baseClass, colorClass, disabledClass, fullWidth && 'w-full', className));

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
