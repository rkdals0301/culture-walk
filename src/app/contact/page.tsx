import InfoPageShell from '@/components/Info/InfoPageShell';

import type { Metadata } from 'next';

import { ArrowUpRight, Clock, FileText, Link2, Mail, MapPin } from 'lucide-react';

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'rkdals0301@naver.com';

const CONTACT_TOPICS = [
  { title: '행사 정보 오류', detail: '위치, 일정, 링크가 실제 안내와 다를 때' },
  { title: '서비스 이용 문제', detail: '검색이나 지도에서 예상과 다르게 동작할 때' },
  { title: '정책 관련 문의', detail: '개인정보, 광고, 사이트 운영에 대해 궁금할 때' },
  { title: '개선 제안', detail: '더 편하게 행사 정보를 찾는 방법을 제안하고 싶을 때' },
];

const MESSAGE_CHECKLIST = [
  { icon: Link2, title: '페이지 주소', detail: '문제가 발생한 화면의 주소' },
  { icon: MapPin, title: '행사명과 지역', detail: '관련된 행사의 이름과 지역' },
  { icon: FileText, title: '문제 내용', detail: '어떤 정보가 다르게 보이는지' },
  { icon: Clock, title: '발생한 시간', detail: '문제를 확인한 대략적인 시각' },
];

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
      title='행사 정보가 다르면 알려주세요.'
      description='문화산책 이용 중 발견한 오류, 행사 정보 수정 요청, 개인정보 및 광고 관련 문의를 메일로 보내주세요.'
    >
      <div className='info-contact-layout'>
        <section className='info-contact-topics' aria-labelledby='contact-topics-title'>
          <div className='info-section-header'>
            <h2 id='contact-topics-title' className='info-section-heading'>
              이런 내용을 확인합니다.
            </h2>
            <p className='info-section-lede'>
              아래 항목에 해당하는 내용을 확인합니다. 행사 정보는 공식 안내와 함께 보내주시면 더 정확하게 살펴볼 수
              있습니다.
            </p>
          </div>
          <dl className='info-topic-list'>
            {CONTACT_TOPICS.map(topic => (
              <div key={topic.title} className='info-topic-item'>
                <dt>{topic.title}</dt>
                <dd>{topic.detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className='info-contact-card' aria-labelledby='contact-checklist-title'>
          <div className='info-contact-card-heading'>
            <span className='info-contact-card-icon'>
              <Mail aria-hidden='true' className='size-[1.15rem]' strokeWidth={1.8} />
            </span>
            <h2 id='contact-checklist-title'>메일로 알려주세요.</h2>
          </div>
          <p className='info-contact-card-lede'>아래 정보가 있으면 문제를 더 정확하게 확인할 수 있습니다.</p>
          <ul className='info-checklist'>
            {MESSAGE_CHECKLIST.map(({ icon: Icon, title, detail }) => (
              <li key={title} className='info-checklist-item'>
                <span className='info-checklist-icon'>
                  <Icon aria-hidden='true' className='size-4' strokeWidth={1.8} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <span>{detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <a href={`mailto:${CONTACT_EMAIL}`} className='info-mail-action group'>
            <span className='info-mail-action-copy'>
              <span className='info-mail-action-label'>문의 메일</span>
              <span>{CONTACT_EMAIL}</span>
            </span>
            <ArrowUpRight
              aria-hidden='true'
              className='info-mail-action-arrow transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5'
              strokeWidth={1.8}
            />
          </a>
        </section>
      </div>

      <section className='info-source-note' aria-labelledby='contact-source-title'>
        <span className='info-source-icon'>
          <FileText aria-hidden='true' className='size-4' strokeWidth={1.8} />
        </span>
        <div>
          <h2 id='contact-source-title'>데이터 출처 안내</h2>
          <p>
            문화산책의 행사 정보는 한국관광공사 TourAPI 공개 데이터를 기반으로 구성됩니다. 행사 취소, 시간 변경, 예약
            마감은 원천 기관에서 먼저 반영될 수 있으므로 실제 방문 전 공식 상세 페이지를 확인해 주세요.
          </p>
        </div>
      </section>
    </InfoPageShell>
  );
};

export default ContactPage;
