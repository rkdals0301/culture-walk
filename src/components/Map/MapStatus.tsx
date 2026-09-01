'use client';

import type { KakaoMapsSdkErrorCode } from '@/utils/kakaoMapsSdk';

import { AlertCircle } from 'lucide-react';

export type MapStatusKind = 'map-error' | 'api-error';

interface MapStatusCopy {
  title: string;
  detail: string;
  retryLabel?: string;
  continueLabel?: string;
}

export const getMapStatusCopy = (kind: MapStatusKind, code?: KakaoMapsSdkErrorCode): MapStatusCopy => {
  if (kind === 'api-error') {
    return {
      title: '행사 데이터를 불러오지 못했습니다.',
      detail: '잠시 후 다시 시도하거나 목록에서 데이터를 다시 불러와 주세요.',
      retryLabel: '다시 불러오기',
    };
  }

  const detailByCode: Record<KakaoMapsSdkErrorCode | 'default', string> = {
    'missing-key': 'Kakao Maps 앱 키가 설정되지 않았습니다. 행사 목록은 계속 이용할 수 있습니다.',
    'invalid-key': 'Kakao Maps 앱 키 형식이 올바르지 않습니다. 설정을 확인한 뒤 다시 시도해 주세요.',
    network: 'Kakao Maps SDK 네트워크 요청에 실패했습니다. 네트워크를 확인한 뒤 다시 시도해 주세요.',
    timeout: 'Kakao Maps SDK 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.',
    'sdk-error': 'Kakao Maps SDK를 초기화하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    default: '지도를 초기화하지 못했습니다. 잠시 후 다시 시도해 주세요.',
  };

  return {
    title: '지도를 불러오지 못했습니다.',
    detail: detailByCode[code ?? 'default'],
    retryLabel: '다시 시도',
    continueLabel: '목록으로 계속 보기',
  };
};

interface MapStatusProps {
  kind: MapStatusKind;
  code?: KakaoMapsSdkErrorCode;
  message?: string;
  onRetry?: () => void;
  onContinueWithList?: () => void;
}

const MapStatus = ({ kind, code, message, onRetry, onContinueWithList }: MapStatusProps) => {
  const copy = getMapStatusCopy(kind, code);

  return (
    <div
      className='status-callout flex size-full items-center justify-center p-4 sm:p-6'
      data-status={kind}
      role='alert'
    >
      <div className='w-full max-w-xl rounded-xl p-6 text-[var(--color-text-primary)] sm:p-8'>
        <div className='flex items-start gap-3'>
          <AlertCircle aria-hidden='true' className='mt-0.5 size-5 shrink-0' strokeWidth={1.8} />
          <div className='min-w-0'>
            <p className='route-kicker'>{kind === 'map-error' ? '지도 연결' : '행사 데이터'}</p>
            <h2 className='mt-3 text-2xl font-semibold tracking-[-0.03em]'>{copy.title}</h2>
            <p className='mt-2 text-sm leading-6 text-[var(--color-text-secondary)]'>{message ?? copy.detail}</p>
            {(onRetry || onContinueWithList) && (
              <div className='mt-5 flex flex-wrap gap-2'>
                {onRetry && copy.retryLabel && (
                  <button
                    type='button'
                    onClick={onRetry}
                    className='inline-flex min-h-11 items-center rounded-lg bg-[var(--color-brand-primary)] px-4 text-sm font-semibold text-[var(--color-brand-on-primary)] transition hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)]'
                  >
                    {copy.retryLabel}
                  </button>
                )}
                {onContinueWithList && copy.continueLabel && (
                  <button
                    type='button'
                    onClick={onContinueWithList}
                    className='soft-chip inline-flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold transition hover:bg-[var(--color-interactive-hover)] active:bg-[var(--color-interactive-active)]'
                  >
                    {copy.continueLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapStatus;
