import Image from 'next/image';

interface CultureImageFallbackProps {
  compact?: boolean;
  classification?: string;
}

const CultureImageFallback = ({ compact = false, classification }: CultureImageFallbackProps) => (
  <div className='flex size-full flex-col items-center justify-center bg-[#edf4f0] text-center dark:bg-[#10251f]'>
    <Image
      src='/assets/images/logo-128.png'
      alt=''
      width={compact ? 34 : 56}
      height={compact ? 34 : 56}
      className={compact ? 'rounded-[10px] opacity-75' : 'rounded-[14px] opacity-80'}
    />
    {!compact && (
      <div className='mt-3 px-4'>
        <p className='text-sm font-semibold text-[var(--app-text)]'>행사 이미지 준비 중</p>
        {classification && <p className='mt-1 text-xs text-[var(--app-muted)]'>{classification}</p>}
      </div>
    )}
  </div>
);

export default CultureImageFallback;
