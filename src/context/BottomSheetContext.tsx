'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export type BottomSheetMode = 'peek' | 'expanded';

interface OpenBottomSheetParams {
  content: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  onBack?: () => void;
  backLabel?: string;
  closeOnRouteExit?: boolean;
  mobileSheetMode?: BottomSheetMode;
}

interface BottomSheetContextProps {
  isOpen: boolean;
  content: React.ReactNode | null;
  footer: React.ReactNode | null;
  closeOnRouteExit: boolean;
  backLabel: string | null;
  mobileSheetMode: BottomSheetMode;
  setMobileSheetMode: (mode: BottomSheetMode) => void;
  openBottomSheet: (params: OpenBottomSheetParams) => void;
  backBottomSheet: () => void;
  closeBottomSheet: () => void;
  dismissBottomSheet: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextProps | undefined>(undefined);

export const BottomSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode | null>(null);
  const [footer, setFooter] = useState<React.ReactNode | null>(null);
  const [closeOnRouteExit, setCloseOnRouteExit] = useState(false);
  const [backLabel, setBackLabel] = useState<string | null>(null);
  const [mobileSheetMode, setMobileSheetMode] = useState<BottomSheetMode>('peek');
  const isOpenRef = useRef(false);

  const onCloseCallbackRef = useRef<(() => void) | null>(null);
  const onBackCallbackRef = useRef<(() => void) | null>(null);

  const dismissBottomSheet = useCallback(() => {
    isOpenRef.current = false;
    setIsOpen(false);
    setContent(null);
    setFooter(null);
    setCloseOnRouteExit(false);
    setBackLabel(null);
    onCloseCallbackRef.current = null;
    onBackCallbackRef.current = null;
  }, []);

  const openBottomSheet = useCallback(
    ({ content, footer, onClose, onBack, backLabel, closeOnRouteExit, mobileSheetMode: nextMobileSheetMode }: OpenBottomSheetParams) => {
      const wasOpen = isOpenRef.current;
      isOpenRef.current = true;
      setIsOpen(true);
      setContent(content);
      setFooter(footer ?? null);
      setCloseOnRouteExit(Boolean(closeOnRouteExit));
      setBackLabel(onBack ? backLabel ?? '뒤로' : null);
      if (!wasOpen || nextMobileSheetMode) {
        setMobileSheetMode(nextMobileSheetMode ?? 'peek');
      }
      onCloseCallbackRef.current = onClose ?? null;
      onBackCallbackRef.current = onBack ?? null;
    },
    []
  );

  const backBottomSheet = useCallback(() => {
    const onBack = onBackCallbackRef.current;
    dismissBottomSheet();
    onBack?.();
  }, [dismissBottomSheet]);

  const closeBottomSheet = useCallback(() => {
    const onClose = onCloseCallbackRef.current;
    dismissBottomSheet();
    onClose?.();
  }, [dismissBottomSheet]);

  return (
    <BottomSheetContext.Provider
      value={{
        isOpen,
        content,
        footer,
        closeOnRouteExit,
        backLabel,
        mobileSheetMode,
        setMobileSheetMode,
        openBottomSheet,
        backBottomSheet,
        closeBottomSheet,
        dismissBottomSheet,
      }}
    >
      {children}
    </BottomSheetContext.Provider>
  );
};

export const useBottomSheet = () => {
  const context = useContext(BottomSheetContext);
  if (!context) {
    throw new Error('useBottomSheet must be used within a BottomSheetProvider');
  }
  return context;
};
