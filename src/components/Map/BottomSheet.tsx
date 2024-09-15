// src/components/BottomSheet.tsx
import React, { useState, useRef, useEffect } from 'react';
import styles from './BottomSheet.module.scss';

const BOTTOM_SHEET_STAGES = [250, 500]; // 높이 단계 정의

const BottomSheet: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(BOTTOM_SHEET_STAGES[0]);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false); // 드래그 중인지 확인하는 플래그

  // 드래그 시작
  const startDrag = (e: TouchEvent | MouseEvent) => {
    e.preventDefault();
    setStartY('touches' in e ? e.touches[0].clientY : e.clientY);
    setCurrentY(0); // 드래그 시작 시 현재 Y 위치 초기화
    isDragging.current = true; // 드래그 시작
  };

  // 드래그 중
  const drag = (e: TouchEvent | MouseEvent) => {
    e.preventDefault();
    if (isDragging.current) {
      const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setCurrentY(y - startY); // 드래그 방향 계산
    }
  };

  // 드래그 종료
  const endDrag = () => {
    if (isDragging.current) {
      const threshold = 20; // 임계값을 줄여서 더 민감하게 반응
      const currentStageIndex = BOTTOM_SHEET_STAGES.findIndex(h => height === h);

      if (currentY < -threshold) {
        // 위로 드래그 (높이 증가)
        if (currentStageIndex < BOTTOM_SHEET_STAGES.length - 1) {
          // 다음 단계로 이동
          setHeight(BOTTOM_SHEET_STAGES[currentStageIndex + 1]);
          setIsOpen(true);
        }
      } else if (currentY > threshold) {
        // 아래로 드래그 (높이 감소)
        if (currentStageIndex > 0) {
          // 이전 단계로 이동
          setHeight(BOTTOM_SHEET_STAGES[currentStageIndex - 1]);
          setIsOpen(true);
        } else if (height === BOTTOM_SHEET_STAGES[0]) {
          // 250에서 아래로 드래그하면 닫기
          setIsOpen(false);
        }
      }

      // 드래그 종료
      setCurrentY(0);
      isDragging.current = false;
    }
  };

  useEffect(() => {
    const sheetElement = sheetRef.current;

    const handleTouchStart = (e: TouchEvent) => startDrag(e);
    const handleTouchMove = (e: TouchEvent) => drag(e);
    const handleTouchEnd = () => endDrag();
    const handleMouseDown = (e: MouseEvent) => startDrag(e);
    const handleMouseMove = (e: MouseEvent) => drag(e);
    const handleMouseUp = () => endDrag();

    const options = { passive: false };

    if (sheetElement) {
      sheetElement.addEventListener('touchstart', handleTouchStart, options);
      sheetElement.addEventListener('touchmove', handleTouchMove, options);
      sheetElement.addEventListener('touchend', handleTouchEnd);
      sheetElement.addEventListener('mousedown', handleMouseDown, options);
      document.addEventListener('mousemove', handleMouseMove, options); // document에 mousemove 이벤트 등록
      document.addEventListener('mouseup', handleMouseUp); // document에 mouseup 이벤트 등록
    }

    return () => {
      if (sheetElement) {
        sheetElement.removeEventListener('touchstart', handleTouchStart);
        sheetElement.removeEventListener('touchmove', handleTouchMove);
        sheetElement.removeEventListener('touchend', handleTouchEnd);
        sheetElement.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [startY, currentY, height]);

  return (
    <div
      ref={sheetRef}
      className={`${styles.sheet} ${isOpen ? styles.open : styles.closed}`}
      style={{ height: `${height}px` }}
    >
      <div className={styles.handle} />
      {/* 바텀 시트 내용 */}
    </div>
  );
};

export default BottomSheet;
