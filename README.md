# Culture Walk

서울시 문화행사 정보를 지도에서 탐색하는 Next.js 앱입니다.

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

- `SEOUL_API_CULTURAL_URL`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `SYNC_TOKEN` (권장, initialize 보호)

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
- `npm run serve`: 빌드 후 로컬 서빙
- `npm run lint`: ESLint
- `npm run typecheck`: TypeScript 타입 체크
- `npm run db:generate`: drizzle migration 파일 생성
- `npm run db:migrate:local`: 로컬 D1 마이그레이션 적용
- `npm run db:migrate:remote`: 원격 D1 마이그레이션 적용
- `npm run cf:build`: OpenNext Cloudflare 빌드
- `npm run preview`: Cloudflare(wrangler) 로컬 프리뷰
- `npm run deploy`: Cloudflare 배포

## Cloudflare

- 설정 파일: `wrangler.jsonc`
- OpenNext 설정: `open-next.config.ts`
- Worker 진입점: `worker.js`
- 스케줄: `wrangler.jsonc`의 cron에서 `/api/initialize` 호출

주의:

- `wrangler.jsonc`의 D1/KV id는 실제 리소스 값으로 교체해야 합니다.
- `SYNC_TOKEN`은 `wrangler secret put SYNC_TOKEN`으로 설정하는 것을 권장합니다.
