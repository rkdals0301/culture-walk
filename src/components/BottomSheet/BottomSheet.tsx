'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBottomSheet } from '@/context/BottomSheetContext';
import styles from './BottomSheet.module.scss';

// const BOTTOM_SHEET_STAGES = [250, 490];
const BOTTOM_SHEET_STAGES = [240];

const BottomSheet = () => {
  const { isOpen, content, height, closeBottomSheet, setHeight } = useBottomSheet();
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

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
          closeBottomSheet();
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

  return (
    <motion.div
      ref={sheetRef}
      className={styles['sheet']}
      animate={{ height, bottom: isOpen ? 0 : -250 }} // y값에 따라 애니메이션
      transition={{ duration: 0.3 }}
    >
      <div ref={headerRef} className={styles['sheet-header']}>
        <div className={styles['handle']} />
      </div>
      <div className={styles['sheet-content']}>{content}</div>
    </motion.div>
  );
};

export default BottomSheet;
