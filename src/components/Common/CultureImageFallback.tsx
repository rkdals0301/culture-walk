import {
  GalleryVerticalEnd,
  Hand,
  MapPin,
  Music2,
  PartyPopper,
} from 'lucide-react';

interface CultureImageFallbackProps {
  compact?: boolean;
  classification?: string;
}

interface ClassificationIconProps {
  classification?: string;
  compact: boolean;
}

const ClassificationIcon = ({ classification, compact }: ClassificationIconProps) => {
  const iconClassName = compact ? 'size-6' : 'size-10';
  const iconProps = { 'aria-hidden': true, strokeWidth: 1.6, className: iconClassName } as const;

  if (classification?.includes('공연')) return <Music2 {...iconProps} />;
  if (classification?.includes('전시')) return <GalleryVerticalEnd {...iconProps} />;
  if (classification?.includes('축제')) return <PartyPopper {...iconProps} />;
  if (classification?.includes('교육') || classification?.includes('체험')) return <Hand {...iconProps} />;

  return <MapPin {...iconProps} />;
};

const CultureImageFallback = ({ compact = false, classification }: CultureImageFallbackProps) => {
  const label = classification || '문화행사';

  return (
    <div className='flex size-full flex-col items-center justify-center gap-2 bg-[#edf4f0] text-center text-[#397662] dark:bg-[#10251f] dark:text-[#8dc5b5]'>
      <ClassificationIcon classification={classification} compact={compact} />
      {!compact && <span className='text-xs font-semibold'>{label}</span>}
    </div>
  );
};

export default CultureImageFallback;
