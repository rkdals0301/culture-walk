'use client';

import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

interface RegionSelectProps {
  region: string;
  regionOptions: string[];
  onChange: (region: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const RegionSelect = ({ region, regionOptions, onChange, size = 'md', className }: RegionSelectProps) => (
  <div className={clsx('relative', className ? className : 'shrink-0')}>
    <select
      aria-label='지역 필터'
      value={region}
      onChange={event => onChange(event.target.value)}
      className={clsx(
        'appearance-none rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-surface-chip)] font-bold text-[var(--color-text-primary)] shadow-2xs transition-colors hover:border-[var(--color-border-control)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)]',
        className?.includes('w-full') ? 'w-full' : '',
        size === 'sm' ? 'h-8 pl-2.5 pr-6 text-[0.72rem]' : 'h-8 sm:h-9 pl-3 pr-7 text-xs'
      )}
    >
      <option value='all'>전국 전체</option>
      {regionOptions.map(option => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <ChevronDown
      aria-hidden='true'
      className={clsx(
        'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]',
        size === 'sm' ? 'right-1.5 size-3.5' : 'right-2 size-3.5'
      )}
      strokeWidth={2}
    />
  </div>
);
