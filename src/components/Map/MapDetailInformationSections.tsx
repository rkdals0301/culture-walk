import type { FormattedCultureDetail } from '@/types/culture';
import type { CultureAdditionalInformation } from '@/types/culture';
import { formatCultureDetailText, hasMeaningfulCultureValue } from '@/utils/cultureUtils';

import { ChevronDown } from 'lucide-react';

interface MapDetailInformationSectionsProps {
  culture: FormattedCultureDetail;
  hasOverview: boolean;
  hasProgram: boolean;
  visibleAdditionalInformation: CultureAdditionalInformation[];
}

export const MapDetailInformationSections = ({
  culture,
  hasOverview,
  hasProgram,
  visibleAdditionalInformation,
}: MapDetailInformationSectionsProps) => {
  const hasUsageInformation = [
    culture.bookingPlace,
    culture.placeInformation,
    culture.festivalGrade,
    culture.discountInformation,
  ].some(hasMeaningfulCultureValue);

  return (
    <>
      {hasOverview && (
        <section className='border-t border-[var(--color-detail-divider)] pt-4'>
          <h2 className='text-base font-semibold tracking-tight text-[var(--color-text-primary)]'>행사 소개</h2>
          <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--color-text-secondary)]'>{culture.overview}</p>
        </section>
      )}

      {hasProgram && (
        <section className='border-t border-[var(--color-detail-divider)] pt-4'>
          <h2 className='text-base font-semibold tracking-tight text-[var(--color-text-primary)]'>프로그램</h2>
          <p className='mt-2 whitespace-pre-line break-words text-sm leading-6 text-[var(--color-text-secondary)]'>{culture.programIntroduction}</p>
        </section>
      )}

      {hasUsageInformation && (
        <section className='border-t border-[var(--color-detail-divider)] pt-4'>
          <h2 className='text-base font-semibold tracking-tight text-[var(--color-text-primary)]'>이용 안내</h2>
          <dl className='mt-2 grid gap-2 text-sm leading-6 text-[var(--color-text-secondary)]'>
            {hasMeaningfulCultureValue(culture.bookingPlace) && <div className='grid grid-cols-[3.8rem_1fr] gap-3'><dt className='font-semibold text-[var(--color-text-primary)]'>예매처</dt><dd className='whitespace-pre-line break-words'>{formatCultureDetailText(culture.bookingPlace)}</dd></div>}
            {hasMeaningfulCultureValue(culture.placeInformation) && <div className='grid grid-cols-[3.8rem_1fr] gap-3'><dt className='font-semibold text-[var(--color-text-primary)]'>장소 안내</dt><dd className='whitespace-pre-line break-words'>{formatCultureDetailText(culture.placeInformation)}</dd></div>}
            {hasMeaningfulCultureValue(culture.festivalGrade) && <div className='grid grid-cols-[3.8rem_1fr] gap-3'><dt className='font-semibold text-[var(--color-text-primary)]'>등급</dt><dd className='break-words'>{culture.festivalGrade}</dd></div>}
            {hasMeaningfulCultureValue(culture.discountInformation) && <div className='grid grid-cols-[3.8rem_1fr] gap-3'><dt className='font-semibold text-[var(--color-text-primary)]'>할인</dt><dd className='whitespace-pre-line break-words'>{formatCultureDetailText(culture.discountInformation)}</dd></div>}
          </dl>
        </section>
      )}

      {visibleAdditionalInformation.length > 0 && (
        <details open className='group border-t border-[var(--color-detail-divider)] pt-4'>
          <summary className='flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[var(--color-text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]'>
            <span>추가 안내</span>
            <ChevronDown className='size-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-200 group-open:rotate-180' strokeWidth={1.8} />
          </summary>
          <dl className='mt-3 grid gap-3 text-sm leading-6 text-[var(--color-text-secondary)]'>
            {visibleAdditionalInformation.map((item, index) => (
              <div key={`${item.name}:${index}`}><dt className='font-semibold text-[var(--color-text-primary)]'>{item.name}</dt><dd className='mt-1 whitespace-pre-line break-words'>{item.text}</dd></div>
            ))}
          </dl>
        </details>
      )}
    </>
  );
};
