import InfoPageShell from '@/components/Info/InfoPageShell';
import { getRuntimeDeps } from '@/server/cloudflare';
import { getPublicHealthReport } from '@/server/publicHealth';

import type { Metadata } from 'next';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: '운영 상태',
  description: '문화산책 공개 read model의 상태와 용량을 확인하는 운영 진단 화면입니다.',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

const formatDateTime = (value: string | null) => {
  if (!value) return '확인 불가';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '확인 불가';

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Seoul',
  }).format(date);
};

const formatBytes = (value: number | null) => {
  if (value === null) return '확인 불가';
  return `${(value / 1024).toFixed(1)} KB`;
};

const OpsPage = async () => {
  const report = await getPublicHealthReport(await getRuntimeDeps());
  const health = report.body;
  const budget = health.readModel.budget;
  const statusLabel =
    health.status === 'healthy' ? '정상' : health.status === 'degraded' ? '주의' : '사용 불가';

  const facts = [
    { label: '서비스 상태', value: statusLabel },
    { label: '공개 행사 수', value: `${health.readModel.itemCount.toLocaleString('ko-KR')}개` },
    { label: '마지막 snapshot', value: formatDateTime(health.readModel.cachedAt) },
    {
      label: 'snapshot 경과',
      value:
        health.readModel.ageHours === null ? '확인 불가' : `${health.readModel.ageHours.toFixed(1)}시간`,
    },
    { label: 'read model 크기', value: formatBytes(health.readModel.serializedBytes) },
    {
      label: '용량 budget',
      value:
        budget.utilizationPercent === null
          ? budget.status
          : `${budget.status} · ${budget.utilizationPercent.toFixed(2)}%`,
    },
  ];

  return (
    <InfoPageShell
      title='운영 상태를 빠르게 확인합니다.'
      description='민감한 데이터베이스 정보 없이, 실제 사용자 요청을 제공하는 KV read model의 최신성·용량·공개 행사 수만 표시합니다.'
      action={
        <Link className='info-map-action' href='/api/health'>
          원본 health JSON 보기
        </Link>
      }
    >
      <section className='info-section info-section-split' aria-labelledby='ops-health-title'>
        <div className='info-section-header'>
          <h2 id='ops-health-title' className='info-section-heading'>
            현재 공개 서비스 상태
          </h2>
          <p className='info-section-lede'>{health.message}</p>
        </div>
        <dl className='info-fact-grid'>
          {facts.map(fact => (
            <div key={fact.label} className='info-fact-item'>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <aside className='info-note' aria-label='운영 진단 범위 안내'>
        <div>
          <h2>D1은 이 화면에서 직접 점검하지 않습니다.</h2>
          <p>
            공개 health와 동일하게 D1 row-read quota를 소모하지 않는 진단 경로입니다. 상세 데이터베이스 오류와 동기화 실패는
            scheduled sync 로그와 Production Smoke incident에서 확인합니다.
          </p>
        </div>
      </aside>
    </InfoPageShell>
  );
};

export default OpsPage;
