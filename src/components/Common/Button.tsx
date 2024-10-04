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
  onClick: () => void;
}

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ariaLabel,
  disabled = false,
  onClick,
  ...props
}: ButtonProps) => {
  const baseClass = `flex justify-center items-center rounded transition duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  const colorClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-500',
    success: 'bg-green-500 text-white hover:bg-green-400',
    danger: 'bg-red-600 text-white hover:bg-red-500',
    gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400',
  };

  const disabledColorClasses = {
    primary: 'bg-blue-400 text-gray-300',
    secondary: 'bg-gray-400 text-gray-300',
    success: 'bg-green-400 text-gray-300',
    danger: 'bg-red-400 text-gray-300',
    gradient: 'bg-gradient-to-r from-purple-300 to-pink-300 text-gray-300',
  };

  const colorClass = disabled ? disabledColorClasses[variant] : colorClasses[variant];

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const sizeClass = sizeClasses[size];

  // clsx와 twMerge를 사용하여 클래스 병합
  const buttonClass = twMerge(clsx(baseClass, colorClass, sizeClass, fullWidth && 'w-full'));

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
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
