import InfoPageShell from '@/components/Info/InfoPageShell';

import type { Metadata } from 'next';

import { ArrowUpRight } from 'lucide-react';

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'rkdals0301@naver.com';

export const metadata: Metadata = {
  title: '문의',
  description: '문화산책 서비스 오류, 데이터 수정, 광고 및 개인정보 관련 문의 방법을 안내합니다.',
  alternates: {
    canonical: '/contact',
  },
};

const ContactPage = () => {
  return (
    <InfoPageShell
      title='서비스 문의'
      description='문화산책 이용 중 발견한 오류, 행사 정보 수정 요청, 개인정보 및 광고 관련 문의를 남길 수 있습니다.'
    >
      <div className='grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)] lg:gap-12'>
        <section aria-labelledby='contact-topics-title'>
          <h2 id='contact-topics-title' className='text-2xl font-semibold tracking-[-0.03em]'>
            이런 이야기를 보내주세요.
          </h2>
          <ul className='contact-topics-list mt-5 grid gap-1'>
            {[
              '행사 위치·일정·링크 오류 제보',
              '검색 또는 지도 이용 중 발생한 문제',
              '개인정보·광고·사이트 정책 관련 문의',
              '서비스 개선 제안',
            ].map(topic => (
              <li
                key={topic}
                className='flex items-start gap-4 py-4 text-sm leading-6 text-[var(--color-text-secondary)]'
              >
                <span className='mt-3 h-px w-5 shrink-0 bg-[var(--color-accent-primary)]' aria-hidden='true' />
                {topic}
              </li>
            ))}
          </ul>
        </section>

        <section
          className='contact-method grid gap-6 self-start border-l-2 border-[var(--color-brand-primary)] py-1 pl-5 sm:pl-6'
          aria-labelledby='contact-method-title'
        >
          <div>
            <h2 id='contact-method-title' className='text-2xl font-semibold tracking-[-0.03em]'>
              상황을 메일로 알려주세요.
            </h2>
            <p className='mt-3 text-sm leading-7 text-[var(--color-text-secondary)]'>
              브라우저 주소와 오류 화면, 행사명, 발생 시간을 함께 정리하면 더 정확하게 확인할 수 있습니다.
            </p>
          </div>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className='group inline-flex min-h-11 w-fit max-w-full items-center gap-2 break-all border-b-2 border-[var(--color-brand-primary)] px-1 pb-2 text-sm font-semibold text-[var(--color-text-primary)] transition hover:border-[var(--color-brand-hover)] hover:text-[var(--color-brand-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]'
          >
            <span className='break-all'>{CONTACT_EMAIL}</span>
            <ArrowUpRight
              aria-hidden='true'
              className='size-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5'
              strokeWidth={1.8}
            />
          </a>
        </section>
      </div>

      <section
        className='grid gap-3 border-t border-[var(--color-border-primary)] pt-6 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-8'
        aria-labelledby='contact-source-title'
      >
        <h2 id='contact-source-title' className='text-base font-semibold'>
          데이터 출처 안내
        </h2>
        <p className='max-w-4xl text-sm leading-7 text-[var(--color-text-secondary)]'>
          문화산책의 행사 정보는 한국관광공사 TourAPI 공개 데이터를 기반으로 구성됩니다. 행사 취소, 시간 변경, 예약
          마감은 원천 기관에서 먼저 반영될 수 있으므로 실제 방문 전 공식 상세 페이지를 확인해 주세요.
        </p>
      </section>
    </InfoPageShell>
  );
};

export default ContactPage;
