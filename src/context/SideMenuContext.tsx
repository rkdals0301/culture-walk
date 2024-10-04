'use client';

import { ReactNode, createContext, useContext, useState } from 'react';

interface SideMenuContextType {
  isOpen: boolean;
  openSideMenu: () => void;
  closeSideMenu: () => void;
}

const SideMenuContext = createContext<SideMenuContextType | undefined>(undefined);

export const useSideMenu = () => {
  const context = useContext(SideMenuContext);
  if (!context) {
    throw new Error('useSideMenu must be used within a SideMenuProvider');
  }
  return context;
};

export const SideMenuProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openSideMenu = () => setIsOpen(true);
  const closeSideMenu = () => setIsOpen(false);

  return (
    <SideMenuContext.Provider value={{ isOpen, openSideMenu, closeSideMenu }}>{children}</SideMenuContext.Provider>
  );
};
