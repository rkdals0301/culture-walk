# Culture Walk

한국관광공사 TourAPI의 전국 문화행사 정보를 지도에서 탐색하는 Next.js 앱입니다.

## Runtime / Platform

- Next.js 16
- React 19
- Node.js 20+
- npm
- Cloudflare Workers + OpenNext
- Cloudflare D1 + Drizzle ORM
- Cloudflare KV (API 캐시)

## Local Setup

1. 의존성 설치

```bash
npm install
```

2. 환경 변수 파일 생성

```bash
cp .env.example .env
```

필수 환경 변수:

- `TOUR_API_BASE_URL`
- `TOUR_API_KEY`
- `NEXT_PUBLIC_KAKAO_MAPS_APP_KEY`
- `SYNC_TOKEN` (권장, initialize 보호)

SEO/분석(선택):

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (GA4 측정 ID, 예: `G-XXXXXXXXXX`)
- `GOOGLE_SITE_VERIFICATION` (Search Console 메타 검증 토큰)
- `NAVER_SITE_VERIFICATION` (네이버 웹마스터도구 메타 검증 토큰)

3. D1 로컬 마이그레이션

```bash
npm run db:migrate:local
```

4. 개발 서버 실행

```bash
npm run dev
```

## Scripts

- `npm run dev`: 로컬 개발 서버
- `npm run build`: 프로덕션 빌드
- `npm run start`: 빌드 결과 실행
- `npm run lint`: ESLint
- `npm run typecheck`: TypeScript 타입 체크
- `npm test`: 동기화 식별키, 데이터 검증, 한국 날짜 경계 테스트
- `npm run db:migrate:local`: 로컬 D1 마이그레이션 적용
- `npm run db:migrate:remote`: 원격 D1 마이그레이션 적용
- `npm run cf:build`: OpenNext Cloudflare 빌드
- `npm run preview`: Cloudflare(wrangler) 로컬 프리뷰
- `npm run deploy`: Cloudflare 배포

## Operations

- 데이터 상태 확인: `GET /api/health`
- 공개 문화행사 목록: `GET /api/cultures`
- 수동 동기화: `POST /api/initialize` with `x-sync-token`

`/api/health`는 활성/비활성 데이터 수, 좌표와 날짜 정합성, 최신 동기화 결과와 경과 시간을 반환합니다. 최근 36시간 안에 성공한 동기화가 없거나 데이터 품질 기준을 통과하지 못하면 `ok: false`를 반환합니다.

동기화는 TourAPI `searchFestival2`의 현재·예정 행사 전체 페이지를 실행별 staging 영역에 적재한 뒤 `tourapi:{contentid}` 식별키로 기존 행을 갱신합니다. 신규 행은 추가하고, 변경된 행만 갱신하며, 원본에서 사라진 행은 비활성화한 뒤 90일간 보관합니다. 전체 수집 건수가 기존 TourAPI 활성 데이터의 70% 미만으로 급감하면 운영 DB 반영을 중단합니다. 최초 TourAPI 스냅샷이 품질 검증을 통과한 경우에만 이전 데이터 소스를 비활성화 후 삭제합니다. 동시 실행은 소유권 기반 락과 실행별 staging 키로 격리하며, 활성 행의 직접 삭제는 DB 트리거가 차단합니다.

행사 상세를 처음 열거나 원본 `modifiedtime`이 변경된 경우 `detailCommon2`, `detailIntro2`, `detailInfo2`, `detailImage2`를 서버에서 조회합니다. 응답 원문은 `culture_tour_api_details`에 JSON으로 보관하고, 요금·이용 대상·홈페이지처럼 목록 필터에 필요한 요약 필드는 행사 행에도 반영합니다. 이후 상세 조회는 D1과 KV 캐시를 사용하며, 외부 API 일부가 실패하면 기존 상세 데이터를 유지합니다.

## Cloudflare

- 설정 파일: `wrangler.jsonc`
- OpenNext 설정: `open-next.config.ts`
- Worker 진입점: `worker.js`
- 스케줄: `wrangler.jsonc`의 cron에서 동기화 서비스를 직접 실행

배포할 때는 애플리케이션 배포 전에 `npm run db:migrate:remote`로 D1 마이그레이션을 먼저 적용해야 합니다. `0002_snapshot_sync.sql` 적용 직후에는 성공 이력이 없으므로 `/api/health`가 503을 반환하며, 첫 동기화가 성공하면 정상 상태로 전환됩니다.

주의:

- `wrangler.jsonc`의 D1/KV id는 실제 리소스 값으로 교체해야 합니다.
- `SYNC_TOKEN`은 `wrangler secret put SYNC_TOKEN`으로 설정하는 것을 권장합니다.
- `TOUR_API_KEY`는 `wrangler secret put TOUR_API_KEY`로 설정하고, `wrangler.jsonc`에는 base URL만 둡니다.
