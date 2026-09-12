'use client';

import {
  MapDetailFallback,
  MapDetailSheetContent,
  MapDetailSheetFooter,
} from '@/components/Map/MapDetailSheetContent';
import { useBottomSheet } from '@/context/BottomSheetContext';
import type { FormattedCultureDetail } from '@/types/culture';
import { createCultureDetailSignature } from '@/utils/cultureUtils';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

interface MapDetailSheetClientProps {
  initialCulture: FormattedCultureDetail;
}

const MapDetailSheetClient = ({ initialCulture }: MapDetailSheetClientProps) => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const cultureId = useMemo(() => {
    const rawId = params?.id;
    const idValue = Array.isArray(rawId) ? rawId[0] : rawId;
    return idValue ? parseInt(idValue, 10) : NaN;
  }, [params]);

  const culture = initialCulture.id === cultureId ? initialCulture : null;
  const cultureDetailSignature = createCultureDetailSignature(culture);
  const { openBottomSheet } = useBottomSheet();
  const lastSheetSignatureRef = useRef('');

  const [mounted, setMounted] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | undefined>(culture?.mainImage);
  const [imageFailed, setImageFailed] = useState(false);
  const [failedAdditionalImages, setFailedAdditionalImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageFailed(true);
  }, []);

  const handleOpenExternalLink = useCallback((url?: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleBackToMap = useCallback(() => {
    router.push('/map');
  }, [router]);

  const handleSelectImage = useCallback((url: string) => {
    setImgSrc(url);
    setImageFailed(false);
  }, []);

  const handleAdditionalImageError = useCallback((url: string) => {
    setFailedAdditionalImages(current => ({ ...current, [url]: true }));
  }, []);

  const getMapReturnPath = useCallback(() => {
    const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
    params.set('list', 'open');
    if (Number.isSafeInteger(cultureId) && cultureId > 0) {
      params.set('focus', String(cultureId));
      params.set('selected', String(cultureId));
    }
    return `/map?${params.toString()}`;
  }, [cultureId]);

  const handleBottomSheetClose = useCallback(() => {
    router.replace(getMapReturnPath(), { scroll: false });
  }, [getMapReturnPath, router]);

  useEffect(() => {
    setImgSrc(culture?.mainImage);
    setImageFailed(false);
    setFailedAdditionalImages({});
  }, [culture?.id, culture?.mainImage]);

  const renderFooter = useCallback(() => {
    return culture ? <MapDetailSheetFooter culture={culture} onOpenExternalLink={handleOpenExternalLink} /> : null;
  }, [culture, handleOpenExternalLink]);

  const renderContent = useCallback(() => {
    return (
      <MapDetailSheetContent
        culture={culture}
        imageSrc={imgSrc}
        imageFailed={imageFailed}
        failedAdditionalImages={failedAdditionalImages}
        onBackToMap={handleBackToMap}
        onImageError={handleImageError}
        onSelectImage={handleSelectImage}
        onAdditionalImageError={handleAdditionalImageError}
      />
    );
  }, [
    culture,
    failedAdditionalImages,
    handleAdditionalImageError,
    handleBackToMap,
    handleImageError,
    handleSelectImage,
    imageFailed,
    imgSrc,
  ]);

  useEffect(() => {
    const signature = `${cultureId}:${cultureDetailSignature}:${imgSrc ?? 'no-image'}:${imageFailed ? 'image-failed' : 'image-ready'}`;
    if (lastSheetSignatureRef.current === signature) {
      return;
    }

    lastSheetSignatureRef.current = signature;

    openBottomSheet({
      content: renderContent(),
      footer: renderFooter(),
      onClose: handleBottomSheetClose,
      closeOnRouteExit: true,
    });
  }, [
    culture?.id,
    cultureDetailSignature,
    cultureId,
    handleBottomSheetClose,
    imageFailed,
    imgSrc,
    openBottomSheet,
    renderContent,
    renderFooter,
  ]);

  return mounted ? null : <MapDetailFallback culture={initialCulture} />;
};

export default MapDetailSheetClient;
