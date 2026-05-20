import InfoPageShell from '@/components/Info/InfoPageShell';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: '문화산책의 개인정보 수집 여부, 위치 정보 사용 방식, 분석 및 광고 도구 사용에 관한 안내입니다.',
  alternates: {
    canonical: '/privacy',
  },
};

const PrivacyPage = () => {
  return (
    <InfoPageShell
      eyebrow='Privacy'
      title='개인정보처리방침'
      description='문화산책은 서비스 제공에 필요한 범위에서만 정보를 사용하며, 별도의 회원가입 기능을 제공하지 않습니다.'
    >
      <article className='surface-card rounded-[28px] p-5 sm:p-6'>
        <h2 className='text-xl font-semibold tracking-[-0.03em]'>수집하는 정보</h2>
        <p className='mt-3 text-sm leading-7 text-[var(--app-muted)]'>
          문화산책은 회원가입, 댓글, 결제 기능을 제공하지 않으며 이름, 연락처, 주소와 같은 직접 식별 정보를 자체적으로
          수집하지 않습니다. 다만 서비스 안정성 확인을 위해 호스팅 및 분석 도구가 접속 시간, 브라우저 정보, 기기 정보,
          대략적인 지역 정보 같은 비식별 로그를 처리할 수 있습니다.
        </p>
      </article>

      <article className='surface-card rounded-[28px] p-5 sm:p-6'>
        <h2 className='text-xl font-semibold tracking-[-0.03em]'>위치 정보 사용</h2>
        <p className='mt-3 text-sm leading-7 text-[var(--app-muted)]'>
          내 위치 기능은 사용자가 브라우저 권한을 허용한 경우에만 현재 위치를 지도 중심 이동에 사용합니다. 위치 정보는
          서버에 저장하지 않으며, 브라우저 권한 설정에서 언제든지 차단하거나 초기화할 수 있습니다.
        </p>
      </article>

      <article className='surface-card rounded-[28px] p-5 sm:p-6'>
        <h2 className='text-xl font-semibold tracking-[-0.03em]'>분석 및 광고</h2>
        <p className='mt-3 text-sm leading-7 text-[var(--app-muted)]'>
          서비스 품질 개선과 광고 제공을 위해 Google Analytics, Google AdSense 등 제3자 도구가 사용될 수 있습니다.
          이 과정에서 쿠키 또는 유사 기술이 사용될 수 있으며, 사용자는 브라우저 설정 또는 Google 광고 설정에서 맞춤형
          광고와 쿠키 사용을 관리할 수 있습니다.
        </p>
      </article>

      <article className='surface-card rounded-[28px] p-5 sm:p-6'>
        <h2 className='text-xl font-semibold tracking-[-0.03em]'>문의</h2>
        <p className='mt-3 text-sm leading-7 text-[var(--app-muted)]'>
          개인정보 처리와 서비스 운영 관련 문의는 문의 페이지를 통해 접수할 수 있습니다. 접수된 문의는 서비스 개선과
          오류 확인 목적에 한해 사용합니다.
        </p>
      </article>
    </InfoPageShell>
  );
};

export default PrivacyPage;
