'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

interface OpenBottomSheetParams {
  content: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
}

interface BottomSheetContextProps {
  isOpen: boolean;
  isOverlayOpen: boolean;
  content: React.ReactNode | null;
  footer: React.ReactNode | null;
  openBottomSheet: (params: OpenBottomSheetParams) => void;
  closeBottomSheet: () => void;
  setOverlayOpen: (isOpen: boolean) => void;
}

const BottomSheetContext = createContext<BottomSheetContextProps | undefined>(undefined);

export const BottomSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode | null>(null);
  const [footer, setFooter] = useState<React.ReactNode | null>(null);

  const onCloseCallbackRef = useRef<(() => void) | null>(null); // useRef로 콜백 관리

  // 바텀 시트를 열 때 onClose 콜백 설정
  const openBottomSheet = useCallback(({ content, footer, onClose }: OpenBottomSheetParams) => {
    setIsOpen(true);
    setIsOverlayOpen(false);
    setContent(content);
    setFooter(footer ?? null);
    if (onClose) {
      onCloseCallbackRef.current = onClose; // 콜백을 ref에 저장
    }
  }, []);

  // 바텀 시트를 닫을 때 onCloseCallback을 호출
  const closeBottomSheet = useCallback(() => {
    setIsOpen(false);
    setIsOverlayOpen(false);
    setContent(null);
    setFooter(null);
    if (onCloseCallbackRef.current) {
      onCloseCallbackRef.current(); // 바텀 시트가 닫힐 때 콜백 호출
      onCloseCallbackRef.current = null; // 콜백 초기화
    }
  }, []);

  return (
    <BottomSheetContext.Provider
      value={{ isOpen, isOverlayOpen, content, footer, openBottomSheet, closeBottomSheet, setOverlayOpen: setIsOverlayOpen }}
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
