import { getCultureTone } from '@/utils/cultureCategory';

import clsx from 'clsx';

interface CultureCategoryBadgeProps {
  classification?: string | null;
  className?: string;
}

const getToneClassName = (classification?: string | null) => {
  switch (getCultureTone(classification)) {
    case 'education':
      return 'bg-[#e5edf7] text-[#315f8e] dark:bg-[#203b58] dark:text-[#b1d0ee]';
    case 'exhibition':
      return 'bg-[#dff0eb] text-[#176a58] dark:bg-[#17483b] dark:text-[#a8d8c8]';
    case 'performance':
      return 'bg-[#f6e3df] text-[#a44737] dark:bg-[#572c25] dark:text-[#f0b5aa]';
    case 'festival':
      return 'bg-[#f5eccf] text-[#81621b] dark:bg-[#51431d] dark:text-[#ead58a]';
    default:
      return 'bg-[#e9eceb] text-[#52605c] dark:bg-[#29322f] dark:text-[#b9c4c0]';
  }
};

const CultureCategoryBadge = ({ classification, className }: CultureCategoryBadgeProps) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-md px-2 py-1 text-[0.68rem] font-semibold leading-none',
      getToneClassName(classification),
      className
    )}
  >
    {classification || '문화행사'}
  </span>
);

export default CultureCategoryBadge;
