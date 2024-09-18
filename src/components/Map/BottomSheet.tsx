import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './BottomSheet.module.scss';

const BOTTOM_SHEET_STAGES = [250, 500]; // 높이 단계 정의

interface BottomSheetProps {
  onClose: () => void; // 닫기 콜백
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ children, onClose }) => {
  const [height, setHeight] = useState(BOTTOM_SHEET_STAGES[0]);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [closing, setClosing] = useState(false); // 애니메이션 종료 플래그
  const sheetRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false); // 드래그 중인지 확인하는 플래그

  // 드래그 시작
  const startDrag = useCallback((e: TouchEvent | MouseEvent) => {
    e.preventDefault();
    setStartY('touches' in e ? e.touches[0].clientY : e.clientY);
    setCurrentY(0); // 드래그 시작 시 현재 Y 위치 초기화
    isDragging.current = true; // 드래그 시작
  }, []);

  // 드래그 중
  const drag = useCallback(
    (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      if (isDragging.current) {
        const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setCurrentY(y - startY); // 드래그 방향 계산
      }
    },
    [startY]
  );

  // 드래그 종료
  const endDrag = useCallback(() => {
    if (isDragging.current) {
      const threshold = 20; // 임계값을 줄여서 더 민감하게 반응
      const currentStageIndex = BOTTOM_SHEET_STAGES.findIndex(h => height === h);

      if (currentY < -threshold) {
        // 위로 드래그 (높이 증가)
        if (currentStageIndex < BOTTOM_SHEET_STAGES.length - 1) {
          // 다음 단계로 이동
          setHeight(BOTTOM_SHEET_STAGES[currentStageIndex + 1]);
        }
      } else if (currentY > threshold) {
        // 아래로 드래그 (높이 감소)
        if (currentStageIndex > 0) {
          // 이전 단계로 이동
          setHeight(BOTTOM_SHEET_STAGES[currentStageIndex - 1]);
        } else if (height === BOTTOM_SHEET_STAGES[0]) {
          // 250에서 아래로 드래그하면 닫기
          setClosing(true);
        }
      }

      // 드래그 종료
      setCurrentY(0);
      isDragging.current = false;
    }
  }, [currentY, height]);

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
  }, [startDrag, drag, endDrag]);

  useEffect(() => {
    const sheetElement = sheetRef.current;

    if (closing && sheetElement) {
      const handleTransitionEnd = () => {
        onClose();
      };

      // 닫기 애니메이션 시작
      setHeight(0); // 애니메이션으로 height를 0으로 설정하여 닫기

      // 애니메이션 종료 시점 감지
      sheetElement.addEventListener('transitionend', handleTransitionEnd);

      // 이벤트 리스너 제거
      return () => {
        sheetElement.removeEventListener('transitionend', handleTransitionEnd);
      };
    }
  }, [closing, onClose]); // onClose 추가

  return (
    <div ref={sheetRef} className={styles.sheet} style={{ height: `${height}px` }}>
      <div className={styles['sheet-header']}>
        <div className={styles.handle} />
      </div>
      <div className={styles['sheet-content']}>{children}</div>
    </div>
  );
};

export default BottomSheet;
