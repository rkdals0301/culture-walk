import type { FormattedCultureDetail } from '@/types/culture';
import type { CultureDetailViewModel } from '@/utils/cultureDetailViewModel';
import { formatCultureDetailText, hasMeaningfulCultureValue } from '@/utils/cultureUtils';

import { useCallback, useState } from 'react';
import { toast } from 'react-toastify';

import { Check, Copy, Phone } from 'lucide-react';

interface CultureDetailFactsProps {
  culture: FormattedCultureDetail;
  detail: CultureDetailViewModel;
}

const CopyAddressButton = ({ copied, onCopy }: { copied: boolean; onCopy: () => void }) => (
  <button
    type='button'
    onClick={onCopy}
    className='inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-[var(--color-brand-primary)] transition hover:bg-[var(--color-brand-subtle)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)] active:scale-95'
    title='주소 복사'
    aria-live='polite'
  >
    {copied ? <Check className='size-3.5' strokeWidth={1.8} /> : <Copy className='size-3.5' strokeWidth={1.8} />}
    <span>{copied ? '복사됨' : '주소 복사'}</span>
  </button>
);

const CultureDetailFacts = ({ culture, detail }: CultureDetailFactsProps) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const {
    address,
    contactSegments,
    displayFee,
    duration: displayDuration,
    eventTime: displayEventTime,
    fullAddress,
    hasSeparateAddress,
    venueName,
  } = detail;

  const handleCopyAddress = useCallback(async () => {
    if (!fullAddress) return;
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopiedAddress(true);
      toast.success('주소가 복사되었습니다.');
      window.setTimeout(() => setCopiedAddress(false), 2000);
    } catch {
      toast.error('주소 복사에 실패했습니다.');
    }
  }, [fullAddress]);

  return (
    <section className='mt-8 border-t border-[var(--color-detail-divider)] text-sm'>
      <dl>
        <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
          <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>일정</dt>
          <dd className='min-w-0 font-medium text-[var(--color-text-primary)]'>{culture.displayDate}</dd>
        </div>

        {displayEventTime && (
          <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
            <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>운영 시간</dt>
            <dd className='min-w-0 whitespace-pre-line break-words font-medium text-[var(--color-text-primary)]'>
              {formatCultureDetailText(displayEventTime)}
            </dd>
          </div>
        )}

        <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
          <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>장소</dt>
          <dd className='flex min-w-0 flex-wrap items-start justify-between gap-2 font-medium text-[var(--color-text-primary)]'>
            <span className='min-w-0 break-words'>{venueName || '장소 정보 없음'}</span>
            {fullAddress && !hasSeparateAddress && <CopyAddressButton copied={copiedAddress} onCopy={handleCopyAddress} />}
          </dd>
        </div>

        {hasSeparateAddress && (
          <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
            <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>주소</dt>
            <dd className='flex min-w-0 flex-wrap items-start justify-between gap-2 font-medium text-[var(--color-text-primary)]'>
              <span className='min-w-0 break-words'>{address}</span>
              <CopyAddressButton copied={copiedAddress} onCopy={handleCopyAddress} />
            </dd>
          </div>
        )}

        {hasMeaningfulCultureValue(culture.placeInformation) && (
          <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
            <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>장소 안내</dt>
            <dd className='min-w-0 whitespace-pre-line break-words font-medium text-[var(--color-text-primary)]'>
              {culture.placeInformation}
            </dd>
          </div>
        )}

        <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
          <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>관람료</dt>
          <dd className='min-w-0 whitespace-pre-line break-words font-medium text-[var(--color-text-primary)]'>{displayFee}</dd>
        </div>

        {displayDuration && (
          <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
            <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>소요 시간</dt>
            <dd className='min-w-0 whitespace-pre-line break-words font-medium text-[var(--color-text-primary)]'>
              {formatCultureDetailText(displayDuration)}
            </dd>
          </div>
        )}

        {hasMeaningfulCultureValue(culture.bookingPlace) && (
          <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
            <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>예매처</dt>
            <dd className='min-w-0 whitespace-pre-line break-words font-medium text-[var(--color-text-primary)]'>
              {formatCultureDetailText(culture.bookingPlace)}
            </dd>
          </div>
        )}

        {hasMeaningfulCultureValue(culture.discountInformation) && (
          <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
            <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>할인</dt>
            <dd className='min-w-0 whitespace-pre-line break-words font-medium text-[var(--color-text-primary)]'>
              {formatCultureDetailText(culture.discountInformation)}
            </dd>
          </div>
        )}

        {hasMeaningfulCultureValue(culture.useTarget) && (
          <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
            <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>대상</dt>
            <dd className='min-w-0 font-medium text-[var(--color-text-primary)]'>{culture.useTarget}</dd>
          </div>
        )}

        {hasMeaningfulCultureValue(culture.festivalGrade) && (
          <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
            <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>축제 등급</dt>
            <dd className='min-w-0 whitespace-pre-line break-words font-medium text-[var(--color-text-primary)]'>
              {culture.festivalGrade}
            </dd>
          </div>
        )}

        {hasMeaningfulCultureValue(culture.organizationName) && (
          <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
            <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>주최·주관</dt>
            <dd className='min-w-0 whitespace-pre-line break-words font-medium text-[var(--color-text-primary)]'>
              {culture.organizationName}
            </dd>
          </div>
        )}

        {hasMeaningfulCultureValue(culture.contact) && (
          <div className='grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 py-4 sm:grid-cols-[5.5rem_minmax(0,1fr)]'>
            <dt className='pt-0.5 text-xs font-medium text-[var(--color-text-tertiary)]'>문의</dt>
            <dd className='flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 font-medium text-[var(--color-text-primary)]'>
              {contactSegments.map((segment, index) =>
                segment.type === 'phone' ? (
                  <a
                    key={`${segment.type}-${segment.value}-${index}`}
                    href={`tel:${segment.value.replace(/[^0-9+]/g, '')}`}
                    aria-label={`${segment.value} 전화 걸기`}
                    className='inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]'
                  >
                    <Phone className='size-3.5' strokeWidth={1.8} />
                    <span>{segment.value}</span>
                  </a>
                ) : (
                  <span key={`${segment.type}-${index}`} className='whitespace-pre-line break-words'>
                    {segment.value}
                  </span>
                )
              )}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
};

export default CultureDetailFacts;
