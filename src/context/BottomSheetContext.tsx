// BottomSheetContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

interface OpenBottomSheetParams {
  content: React.ReactNode;
  onClose?: () => void;
}

interface BottomSheetContextProps {
  isOpen: boolean;
  content: React.ReactNode | null;
  height: number; // 추가
  setHeight: (value: number) => void; // 추가
  openBottomSheet: (params: OpenBottomSheetParams) => void;
  closeBottomSheet: () => void;
}

const BottomSheetContext = createContext<BottomSheetContextProps | undefined>(undefined);

const BOTTOM_SHEET_STAGES = [200];

export const BottomSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<React.ReactNode | null>(null);
  const [height, setHeight] = useState(BOTTOM_SHEET_STAGES[0]); // 추가

  const onCloseCallbackRef = useRef<(() => void) | null>(null); // useRef로 콜백 관리

  // 바텀 시트를 열 때 onClose 콜백 설정
  const openBottomSheet = useCallback(({ content, onClose }: OpenBottomSheetParams) => {
    setIsOpen(true);
    setContent(content);
    if (onClose) {
      onCloseCallbackRef.current = onClose; // 콜백을 ref에 저장
    }
  }, []);

  // 바텀 시트를 닫을 때 onCloseCallback을 호출
  const closeBottomSheet = useCallback(() => {
    setIsOpen(false);
    setContent(null);
    if (onCloseCallbackRef.current) {
      onCloseCallbackRef.current(); // 바텀 시트가 닫힐 때 콜백 호출
      onCloseCallbackRef.current = null; // 콜백 초기화
    }
  }, []);

  return (
    <BottomSheetContext.Provider value={{ isOpen, content, height, setHeight, openBottomSheet, closeBottomSheet }}>
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
