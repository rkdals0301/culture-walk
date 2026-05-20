import InfoPageShell from '@/components/Info/InfoPageShell';

import type { Metadata } from 'next';

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'contact@gangmin.dev';

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
      eyebrow='Contact'
      title='서비스 문의'
      description='문화산책 이용 중 발견한 오류, 행사 정보 수정 요청, 개인정보 및 광고 관련 문의를 남길 수 있습니다.'
    >
      <div className='grid gap-4 md:grid-cols-2'>
        <article className='surface-card rounded-[28px] p-5 sm:p-6'>
          <h2 className='text-xl font-semibold tracking-[-0.03em]'>문의 가능 항목</h2>
          <ul className='mt-3 grid gap-2 text-sm leading-6 text-[var(--app-muted)]'>
            <li>행사 위치, 일정, 링크 오류 제보</li>
            <li>검색 또는 지도 이용 중 발생한 문제</li>
            <li>개인정보, 광고, 사이트 정책 관련 문의</li>
            <li>서비스 개선 제안</li>
          </ul>
        </article>

        <article className='surface-card rounded-[28px] p-5 sm:p-6'>
          <h2 className='text-xl font-semibold tracking-[-0.03em]'>문의 방법</h2>
          <p className='mt-3 text-sm leading-7 text-[var(--app-muted)]'>
            사이트 운영 및 데이터 관련 문의는 아래 이메일로 전달해 주세요. 브라우저 주소와 오류 화면, 행사명, 발생 시간을
            함께 정리하면 더 정확하게 확인할 수 있습니다.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className='mt-4 inline-flex rounded-full bg-[#1f765f] px-5 py-2.5 text-sm font-semibold text-[#fff8f1] transition hover:bg-[#175846]'
          >
            {CONTACT_EMAIL}
          </a>
        </article>
      </div>

      <article className='surface-card rounded-[28px] p-5 sm:p-6'>
        <h2 className='text-xl font-semibold tracking-[-0.03em]'>데이터 출처 안내</h2>
        <p className='mt-3 text-sm leading-7 text-[var(--app-muted)]'>
          문화산책의 행사 정보는 서울시 문화행사 공개 데이터를 기반으로 구성됩니다. 행사 취소, 시간 변경, 예약 마감은
          원천 기관에서 먼저 반영될 수 있으므로 실제 방문 전 공식 상세 페이지를 확인해 주세요.
        </p>
      </article>
    </InfoPageShell>
  );
};

export default ContactPage;
