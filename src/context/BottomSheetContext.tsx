'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

interface OpenBottomSheetParams {
  content: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  closeOnRouteExit?: boolean;
}

interface BottomSheetContextProps {
  isOpen: boolean;
  content: React.ReactNode | null;
  footer: React.ReactNode | null;
  closeOnRouteExit: boolean;
  openBottomSheet: (params: OpenBottomSheetParams) => void;
  closeBottomSheet: () => void;
  dismissBottomSheet: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextProps | undefined>(undefined);

export const BottomSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode | null>(null);
  const [footer, setFooter] = useState<React.ReactNode | null>(null);
  const [closeOnRouteExit, setCloseOnRouteExit] = useState(false);

  const onCloseCallbackRef = useRef<(() => void) | null>(null); // useRef로 콜백 관리

  // 바텀 시트를 열 때 onClose 콜백 설정
  const dismissBottomSheet = useCallback(() => {
    setIsOpen(false);
    setContent(null);
    setFooter(null);
    setCloseOnRouteExit(false);
    onCloseCallbackRef.current = null;
  }, []);

  const openBottomSheet = useCallback(({ content, footer, onClose, closeOnRouteExit }: OpenBottomSheetParams) => {
    setIsOpen(true);
    setContent(content);
    setFooter(footer ?? null);
    setCloseOnRouteExit(Boolean(closeOnRouteExit));
    onCloseCallbackRef.current = onClose ?? null;
  }, []);

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
        openBottomSheet,
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
