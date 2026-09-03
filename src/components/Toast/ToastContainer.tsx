'use client';

import { type CSSProperties, type MouseEvent, useEffect, useState } from 'react';
import { type IconProps, Slide, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';

const CultureToastIcon = ({ type }: IconProps) => {
  const iconProps = {
    'aria-hidden': true,
    className: 'size-[1.125rem]',
    strokeWidth: 2.25,
  };

  switch (type) {
    case 'success':
      return <CircleCheck {...iconProps} />;
    case 'warning':
      return <TriangleAlert {...iconProps} />;
    case 'info':
      return <Info {...iconProps} />;
    case 'error':
      return <CircleAlert {...iconProps} />;
    default:
      return <Info {...iconProps} />;
  }
};

const CultureToastCloseButton = ({ closeToast }: { closeToast: (event: MouseEvent<HTMLElement>) => void }) => (
  <button
    type='button'
    className='culture-toast-close'
    onClick={event => {
      event.stopPropagation();
      closeToast(event);
    }}
    aria-label='알림 닫기'
  >
    <X aria-hidden='true' className='size-4' strokeWidth={2.1} />
  </button>
);

const CustomToastContainer = () => {
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isMapSurface = pathname === '/map' || pathname?.startsWith('/map/');

  // The map keeps a quiet lane for transient alerts so they never cover the
  // list controls or the map controls. Non-map routes use the usual viewport edge.
  const toastStyle = {
    '--culture-toast-left': isMapSurface ? 'calc(var(--map-sidebar-width) + var(--map-detail-width) + 1.5rem)' : 'auto',
    '--culture-toast-right': isMapSurface
      ? 'calc(6rem + env(safe-area-inset-right, 0px))'
      : 'max(1rem, env(safe-area-inset-right, 0px))',
    '--culture-toast-width': isMapSurface
      ? 'min(22rem, calc(100vw - var(--map-sidebar-width) - var(--map-detail-width) - 8.5rem))'
      : 'min(22rem, calc(100vw - 2rem))',
    '--culture-toast-mobile-left': 'max(0.75rem, env(safe-area-inset-left, 0px))',
    '--culture-toast-mobile-right': isMapSurface
      ? 'calc(7.5rem + env(safe-area-inset-right, 0px))'
      : 'max(0.75rem, env(safe-area-inset-right, 0px))',
    '--culture-toast-mobile-width': isMapSurface
      ? 'min(22rem, calc(100vw - 8.25rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)))'
      : 'min(22rem, calc(100vw - 1.5rem - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px)))',
  } as CSSProperties;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ToastContainer
      position='top-right'
      transition={Slide}
      autoClose={3600}
      closeOnClick
      draggable='touch'
      newestOnTop
      limit={3}
      pauseOnFocusLoss
      pauseOnHover
      hideProgressBar
      icon={CultureToastIcon}
      closeButton={CultureToastCloseButton}
      theme={mounted && resolvedTheme === 'dark' ? 'dark' : 'light'}
      style={toastStyle}
      className='culture-toast-container'
      toastClassName='culture-toast'
      bodyClassName='culture-toast-body'
      progressClassName='culture-toast-progress'
    />
  );
};

export default CustomToastContainer;
