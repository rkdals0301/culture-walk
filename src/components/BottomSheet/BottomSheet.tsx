'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useBottomSheet } from '@/context/BottomSheetContext';
import styles from './BottomSheet.module.scss';

const BOTTOM_SHEET_STAGES = [250, 490]; // 높이 단계 정의

const BottomSheet = () => {
  const { isOpen, content, closeBottomSheet, height, setHeight } = useBottomSheet();
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [closing, setClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null); // header 참조 추가
  const isDragging = useRef(false);
  const animationFrameId = useRef<number | null>(null);

  const startDrag = useCallback((e: TouchEvent | MouseEvent) => {
    setStartY('touches' in e ? e.touches[0].clientY : e.clientY);
    setCurrentY(0);
    isDragging.current = true;
  }, []);

  const drag = useCallback(
    (e: TouchEvent | MouseEvent) => {
      if (isDragging.current) {
        const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setCurrentY(y - startY);
      }
    },
    [startY]
  );

  const endDrag = useCallback(() => {
    if (isDragging.current) {
      const threshold = 20;
      const currentStageIndex = BOTTOM_SHEET_STAGES.findIndex(h => height === h);

      if (currentY < -threshold) {
        if (currentStageIndex < BOTTOM_SHEET_STAGES.length - 1) {
          setHeight(BOTTOM_SHEET_STAGES[currentStageIndex + 1]);
        }
      } else if (currentY > threshold) {
        if (currentStageIndex > 0) {
          setHeight(BOTTOM_SHEET_STAGES[currentStageIndex - 1]);
        } else if (height === BOTTOM_SHEET_STAGES[0]) {
          setClosing(true);
        }
      }

      setCurrentY(0);
      isDragging.current = false;
    }
  }, [currentY, height, setHeight]);

  useEffect(() => {
    const headerElement = headerRef.current;

    const handleTouchStart = (e: TouchEvent) => startDrag(e);
    const handleTouchMove = (e: TouchEvent) => drag(e);
    const handleTouchEnd = () => endDrag();
    const handleMouseDown = (e: MouseEvent) => startDrag(e);
    const handleMouseMove = (e: MouseEvent) => drag(e);
    const handleMouseUp = () => endDrag();

    const options = { passive: false };

    if (headerElement) {
      headerElement.addEventListener('touchstart', handleTouchStart, options);
      headerElement.addEventListener('touchmove', handleTouchMove, options);
      headerElement.addEventListener('touchend', handleTouchEnd);
      headerElement.addEventListener('mousedown', handleMouseDown, options);
      document.addEventListener('mousemove', handleMouseMove, options);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (headerElement) {
        headerElement.removeEventListener('touchstart', handleTouchStart);
        headerElement.removeEventListener('touchmove', handleTouchMove);
        headerElement.removeEventListener('touchend', handleTouchEnd);
        headerElement.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [startDrag, drag, endDrag]);

  useEffect(() => {
    if (isOpen) {
      setClosing(false);
      setHeight(BOTTOM_SHEET_STAGES[0]);
    }
  }, [isOpen, setHeight]);

  useEffect(() => {
    const sheetElement = sheetRef.current;

    if (closing && sheetElement) {
      const handleTransitionEnd = () => {
        closeBottomSheet();
      };

      setHeight(0);
      sheetElement.addEventListener('transitionend', handleTransitionEnd);

      return () => {
        sheetElement.removeEventListener('transitionend', handleTransitionEnd);
      };
    }
  }, [closing, closeBottomSheet, setHeight]);

  useEffect(() => {
    const updateHeight = () => {
      if (sheetRef.current) {
        sheetRef.current.style.height = `${height}px`;
      }
      animationFrameId.current = requestAnimationFrame(updateHeight);
    };

    updateHeight();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    };
  }, [height]);

  return (
    <div ref={sheetRef} className={styles['sheet']}>
      <div ref={headerRef} className={styles['sheet-header']}>
        <div className={styles['handle']} />
      </div>
      <div className={styles['sheet-content']}>{content}</div>
    </div>
  );
};

export default BottomSheet;
