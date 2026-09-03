import { getCultureTone } from '@/utils/cultureCategory';

import clsx from 'clsx';

interface CultureCategoryBadgeProps {
  classification?: string | null;
  className?: string;
}

const getToneClassName = (classification?: string | null) => {
  switch (getCultureTone(classification)) {
    case 'education':
      return 'bg-[var(--color-category-education-surface)] text-[var(--color-category-education-text)]';
    case 'exhibition':
      return 'bg-[var(--color-category-exhibition-surface)] text-[var(--color-category-exhibition-text)]';
    case 'performance':
      return 'bg-[var(--color-category-performance-surface)] text-[var(--color-category-performance-text)]';
    case 'festival':
      return 'bg-[var(--color-category-festival-surface)] text-[var(--color-category-festival-text)]';
    default:
      return 'bg-[var(--color-category-neutral-surface)] text-[var(--color-category-neutral-text)]';
  }
};

const CultureCategoryBadge = ({ classification, className }: CultureCategoryBadgeProps) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold leading-tight tracking-tight shadow-2xs',
      getToneClassName(classification),
      className
    )}
  >
    <span className='size-1.5 rounded-full bg-current opacity-70' aria-hidden='true' />
    {classification || '문화행사'}
  </span>
);

export default CultureCategoryBadge;
