import React from 'react';

import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface IconButtonProps {
  icon: React.ReactNode;
  ariaLabel: string;
  label?: React.ReactNode;
  title?: string;
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
  label,
  title,
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
    'inline-flex items-center justify-center rounded-lg border transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]';
  const disabledClass = disabled
    ? 'cursor-not-allowed border-[var(--color-disabled-border)] bg-[var(--color-interactive-disabled)] text-[var(--color-text-disabled)] opacity-100 shadow-none'
    : '';

  const colorClasses = {
    primary:
      'border-transparent bg-[var(--color-brand-primary)] text-[var(--color-brand-on-primary)] hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)]',
    secondary:
      'border-[var(--color-border-primary)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-chip)] active:bg-[var(--color-interactive-active)]',
    success:
      'border-transparent bg-[var(--color-accent-primary)] text-[var(--color-accent-on-primary)] hover:bg-[var(--color-accent-hover)] active:bg-[var(--color-accent-active)]',
    danger:
      'border-transparent bg-[var(--color-error)] text-[var(--color-error-on-primary)] hover:bg-[var(--color-error-hover)] active:bg-[var(--color-error-hover)]',
  };

  const colorClass = disabled ? '' : colorClasses[variant];

  const iconColorClass = 'text-current';
  const iconSizeClass = 'size-5 sm:size-6';
  const buttonClass = twMerge(
    clsx(
      baseClass,
      colorClass,
      disabledClass,
      fullWidth ? 'w-full' : label ? 'min-h-11 shrink-0' : 'size-11 shrink-0',
      label && 'gap-1.5 px-3',
      className
    )
  );

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      title={title}
      className={buttonClass}
      disabled={disabled}
      {...props}
    >
      <span className={twMerge(clsx(iconSizeClass, iconColorClass), iconClassName)}>{icon}</span>
      {label && <span className='text-sm font-semibold'>{label}</span>}
    </button>
  );
};

export default IconButton;
