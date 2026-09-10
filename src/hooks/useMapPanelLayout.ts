import { useEffect, useState } from 'react';

const DESKTOP_PANEL_WIDTH = 400;
const DESKTOP_DETAIL_PANEL_WIDTH = 480;

export const useMapPanelLayout = (isDesktopPanelCollapsed: boolean, isDetailRoute: boolean) => {
  const [isWideDesktop, setIsWideDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const updateViewport = () => setIsWideDesktop(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const listPanelWidth = isDesktopPanelCollapsed ? 0 : DESKTOP_PANEL_WIDTH;
    const detailPanelWidth = isDetailRoute && isWideDesktop ? DESKTOP_DETAIL_PANEL_WIDTH : 0;
    root.style.setProperty('--map-sidebar-width', `${listPanelWidth}px`);
    root.style.setProperty('--map-detail-width', `${detailPanelWidth}px`);

    const notifyMapResize = () => window.dispatchEvent(new Event('resize'));
    const animationFrame = window.requestAnimationFrame(notifyMapResize);
    const transitionTimer = window.setTimeout(notifyMapResize, 280);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(transitionTimer);
    };
  }, [isDesktopPanelCollapsed, isDetailRoute, isWideDesktop]);
};
