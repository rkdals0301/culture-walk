import { useEffect, useState } from 'react';

import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import { useTheme } from 'next-themes';

const CultureItemSkeleton = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <SkeletonTheme
      baseColor={isDark ? '#1F1F1F' : '#E0E0E0'}
      highlightColor={isDark ? '#3A3A3A' : '#C0C0C0'}
    >
      <div className='flex size-full gap-4'>
        <div className='size-16 flex-none'>
          <Skeleton className='size-full' />
        </div>
        <div className='size-full grow'>
          <Skeleton count={3} className='h-4' />
        </div>
      </div>
    </SkeletonTheme>
  );
};

export default CultureItemSkeleton;
