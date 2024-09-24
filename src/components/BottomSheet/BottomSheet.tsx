'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useBottomSheet } from '@/context/BottomSheetContext';
import styles from './BottomSheet.module.scss';

const BOTTOM_SHEET_STAGES = [215]; // 높이 단계 정의

const BottomSheet = () => {
  const { isOpen, content, closeBottomSheet } = useBottomSheet();

  const [height, setHeight] = useState(0); // 초기 높이를 0으로 설정
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [closing, setClosing] = useState(false); // 애니메이션 종료 플래그
  const sheetRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false); // 드래그 중인지 확인하는 플래그
  const animationFrameId = useRef<number | null>(null); // 애니메이션 프레임 ID 저장

  // 드래그 시작
  const startDrag = useCallback((e: TouchEvent | MouseEvent) => {
    setStartY('touches' in e ? e.touches[0].clientY : e.clientY);
    setCurrentY(0); // 드래그 시작 시 현재 Y 위치 초기화
    isDragging.current = true; // 드래그 시작
  }, []);

  // 드래그 중
  const drag = useCallback(
    (e: TouchEvent | MouseEvent) => {
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
          // 215에서 아래로 드래그하면 닫기
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
    if (isOpen) {
      setClosing(false); // 닫힘 상태를 초기화
      setHeight(BOTTOM_SHEET_STAGES[0]); // 열리면 기본 높이로 설정
    }
  }, [isOpen]);

  useEffect(() => {
    const sheetElement = sheetRef.current;

    if (closing && sheetElement) {
      const handleTransitionEnd = () => {
        closeBottomSheet(); // 트랜지션 종료 시점에 닫기 처리
      };

      // 트랜지션으로 높이를 0으로 설정하여 애니메이션 처리
      setHeight(0);

      sheetElement.addEventListener('transitionend', handleTransitionEnd);

      return () => {
        sheetElement.removeEventListener('transitionend', handleTransitionEnd);
      };
    }
  }, [closing, closeBottomSheet]);

  useEffect(() => {
    const updateHeight = () => {
      if (sheetRef.current) {
        sheetRef.current.style.height = `${height}px`;
      }
      animationFrameId.current = requestAnimationFrame(updateHeight);
    };

    // 첫 애니메이션 프레임 시작
    updateHeight();

    return () => {
      // 애니메이션 프레임 해제
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null; // ID 초기화
      }
    };
  }, [height]);

  return (
    <div ref={sheetRef} className={styles['sheet']}>
      <div className={styles['sheet-header']}>
        <div className={styles['handle']} />
      </div>
      <div className={styles['sheet-content']}>{content}</div>
    </div>
  );
};

export default BottomSheet;
