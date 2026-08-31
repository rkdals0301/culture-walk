import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const CultureItemSkeleton = () => {
  return (
    <SkeletonTheme
      baseColor='var(--color-skeleton-base)'
      highlightColor='var(--color-skeleton-highlight)'
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
