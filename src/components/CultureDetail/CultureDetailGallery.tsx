'use client';

import CultureImageFallback from '@/components/Common/CultureImageFallback';
import type { FormattedCultureDetail } from '@/types/culture';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

interface CultureDetailGalleryProps {
  culture: FormattedCultureDetail;
  imageList: string[];
}

const CultureDetailGallery = ({ culture, imageList }: CultureDetailGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const currentImageUrl = imageList[currentIndex] || culture.mainImage;
  const hasCultureImage =
    typeof currentImageUrl === 'string' &&
    Boolean(currentImageUrl.trim()) &&
    !imageFailed &&
    !currentImageUrl.includes('/assets/images/logo');

  const handlePrevImage = useCallback(() => {
    if (imageList.length <= 1) return;
    setCurrentIndex(previous => (previous > 0 ? previous - 1 : imageList.length - 1));
    setImageFailed(false);
  }, [imageList.length]);

  const handleNextImage = useCallback(() => {
    if (imageList.length <= 1) return;
    setCurrentIndex(previous => (previous < imageList.length - 1 ? previous + 1 : 0));
    setImageFailed(false);
  }, [imageList.length]);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
    touchStartY.current = event.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const deltaX = event.changedTouches[0].clientX - touchStartX.current;
      const deltaY = event.changedTouches[0].clientY - touchStartY.current;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 35) {
        if (deltaX < 0) handleNextImage();
        else handlePrevImage();
      }
      touchStartX.current = null;
      touchStartY.current = null;
    },
    [handleNextImage, handlePrevImage]
  );

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLightboxOpen(false);
      if (event.key === 'ArrowLeft') handlePrevImage();
      if (event.key === 'ArrowRight') handleNextImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextImage, handlePrevImage, isLightboxOpen]);

  return (
    <>
      <div
        className='group relative mx-auto aspect-[4/5] w-full max-w-md select-none overflow-hidden rounded-xl border border-[var(--color-detail-divider)] bg-[var(--color-surface-secondary)] sm:aspect-[3/4] lg:max-w-none'
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {hasCultureImage ? (
          <div
            className='relative size-full cursor-zoom-in'
            onClick={() => setIsLightboxOpen(true)}
            title='클릭하여 전체 포스터 크게 보기'
          >
            <Image
              src={currentImageUrl}
              alt={culture.title}
              fill
              sizes='(min-width: 1024px) 420px, (min-width: 640px) 440px, 100vw'
              className='object-contain transition-opacity duration-200'
              priority
              onError={() => setImageFailed(true)}
            />
          </div>
        ) : (
          <div className='size-full'>
            <CultureImageFallback classification={culture.classification || '문화행사'} />
          </div>
        )}

        {imageList.length > 1 && (
          <>
            <button
              type='button'
              onClick={event => {
                event.stopPropagation();
                handlePrevImage();
              }}
              aria-label='이전 사진 보기'
              className='absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md border border-white/20 bg-zinc-950/75 text-white opacity-0 transition hover:bg-zinc-950 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-95 group-hover:opacity-100'
            >
              <ChevronLeft className='size-4' strokeWidth={1.8} />
            </button>
            <button
              type='button'
              onClick={event => {
                event.stopPropagation();
                handleNextImage();
              }}
              aria-label='다음 사진 보기'
              className='absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md border border-white/20 bg-zinc-950/75 text-white opacity-0 transition hover:bg-zinc-950 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-95 group-hover:opacity-100'
            >
              <ChevronRight className='size-4' strokeWidth={1.8} />
            </button>
          </>
        )}
      </div>

      {hasCultureImage && (
        <div className='mt-2.5 flex items-center justify-between gap-3 px-0.5 text-xs'>
          <button
            type='button'
            onClick={() => setIsLightboxOpen(true)}
            className='inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 font-medium text-[var(--color-brand-primary)] transition hover:bg-[var(--color-brand-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
          >
            <Maximize2 className='size-3.5' strokeWidth={1.8} />
            <span>포스터 크게 보기</span>
          </button>
          {imageList.length > 1 && (
            <span className='tabular-nums text-[var(--color-text-tertiary)]'>
              {currentIndex + 1} / {imageList.length}
            </span>
          )}
        </div>
      )}

      {imageList.length > 1 && (
        <div className='mt-2 flex justify-center gap-2 overflow-x-auto pb-1 lg:justify-start' aria-label='추가 사진 목록'>
          {imageList.map((imageUrl, index) => (
            <button
              type='button'
              key={`${imageUrl}-${index}`}
              onClick={() => {
                setCurrentIndex(index);
                setImageFailed(false);
              }}
              className={`relative size-14 shrink-0 overflow-hidden rounded-md border transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95 ${
                currentIndex === index
                  ? 'border-2 border-[var(--color-brand-primary)]'
                  : 'border-[var(--color-detail-divider)] opacity-75 hover:opacity-100'
              }`}
              aria-label={`사진 ${index + 1} 선택`}
            >
              <Image src={imageUrl} alt='' fill sizes='56px' className='object-cover' />
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen && hasCultureImage && (
        <div
          role='dialog'
          aria-modal='true'
          aria-label='포스터 전체화면 크게 보기'
          className='fixed inset-0 z-50 flex select-none flex-col bg-zinc-950/95'
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className='flex h-14 shrink-0 items-center justify-between px-4 text-white sm:px-6' onClick={event => event.stopPropagation()}>
            <div className='flex items-center gap-2'>
              <span className='text-xs font-medium tabular-nums text-zinc-300'>
                {imageList.length > 1 ? `${currentIndex + 1} / ${imageList.length}` : '원본 포스터'}
              </span>
              <span className='hidden text-xs text-zinc-400 sm:inline'>클릭 또는 ESC 키로 닫기</span>
            </div>
            <button
              type='button'
              onClick={() => setIsLightboxOpen(false)}
              aria-label='확대 보기 닫기'
              className='flex size-10 items-center justify-center rounded-md text-zinc-300 transition hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-95'
            >
              <X className='size-5' strokeWidth={1.8} />
            </button>
          </div>

          <div
            className='relative flex flex-1 items-center justify-center overflow-hidden p-4'
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={event => event.stopPropagation()}
          >
            <Image src={currentImageUrl} alt={culture.title} fill sizes='100vw' className='select-none object-contain' priority />
            {imageList.length > 1 && (
              <>
                <button
                  type='button'
                  onClick={handlePrevImage}
                  aria-label='이전 사진'
                  className='absolute left-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/15 bg-zinc-900/85 text-white transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-95'
                >
                  <ChevronLeft className='size-6' strokeWidth={1.8} />
                </button>
                <button
                  type='button'
                  onClick={handleNextImage}
                  aria-label='다음 사진'
                  className='absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-md border border-white/15 bg-zinc-900/85 text-white transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-95'
                >
                  <ChevronRight className='size-6' strokeWidth={1.8} />
                </button>
              </>
            )}
          </div>

          <div className='pb-6 pt-2 text-center text-xs text-zinc-400'>
            {imageList.length > 1
              ? '좌우로 밀거나 키보드 방향키로 사진을 넘길 수 있습니다'
              : '화면 빈 곳을 탭하거나 닫기(X)를 누르면 상세 페이지로 돌아갑니다'}
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(CultureDetailGallery);
