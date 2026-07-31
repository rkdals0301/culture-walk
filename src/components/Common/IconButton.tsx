import React from 'react';

import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface IconButtonProps {
  icon: React.ReactNode;
  ariaLabel: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  iconClassName?: string;
  className?: string;
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
    'inline-flex items-center justify-center rounded-xl border transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-focus)]';
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

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

  const colorClass = colorClasses[variant];

  const iconColorClass = 'text-current';
  const iconSizeClass = 'size-5 sm:size-6';
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
