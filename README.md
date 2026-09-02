# 🧭 문화산책 (Culture Walk)

한국관광공사 **TourAPI(공공데이터포털 KorService2)**의 전국 문화행사·축제·공연·전시·체험 데이터를 수집하여, **카카오 지도(Kakao Maps SDK)** 위에서 위치 기반으로 직관적으로 탐색할 수 있는 반응형 웹 애플리케이션입니다.

Next.js 16 App Router, Cloudflare Workers, Cloudflare D1(SQLite), Cloudflare KV를 기반으로 엣지(Edge) 환경에서 초고속 응답과 높은 안정성을 제공하도록 설계되었습니다.

---

## 📌 주요 특징 및 기능

### 1. 지도 기반 실시간 문화행사 탐색
- **카카오 지도 연동**: 지도 뷰포트에 맞춘 마커 시각화, 부드러운 지도 이동 및 줌 컨트롤
- **카테고리 필터**: 축제, 공연, 전시, 교육·체험 등 테마별 즉시 필터링
- **지역 필터**: 전국 17개 시·도 및 시·군·구 단위 상세 필터링
- **무료 행사 필터**: 무료 행사만 모아보기 토글 지원
- **키워드 실시간 검색**: 행사 제목, 장소, 설명 대상 즉시 검색
- **내 위치 기반 거리 계산**: Geolocation API를 통해 현재 위치로부터의 거리를 계산하고 거리순/최신순 정렬 지원
- **SDK 안정성 보장**: Kakao Maps JavaScript SDK의 단일 플라이트(Single-flight) 로딩, 타임아웃 감지 및 실패 시 자동 복구/재시도 처리

### 2. 반응형 바텀시트 & 대시보드 인터페이스
- **모바일/데스크톱 대응**: 모바일에서는 스와이프 가능한 Bottom Sheet, 데스크톱에서는 쾌적한 사이드 패널 제공
- **가상화 리스트(`@tanstack/react-virtual`)**: 수백~수천 건의 행사 목록도 끊김 없는 60fps 무한 스크롤 구현
- **상세 정보 시트 (`/map/[id]`)**: 행사 개요, 기간, 장소, 요금, 주최/주관, 이용 대상, 이미지 갤러리, 공식 홈페이지 및 예매 링크 제공
- **탐색 상태 보존 (`exploreState`)**: 행사 상세 페이지 진입 후 목록으로 복귀해도 검색어, 카테고리, 지역 필터, 정렬 모드, 스크롤 위치 완벽 복원

### 3. SEO & 웹 표준 & 접근성 최적화
- **동적 메타데이터 & SNS 공유**: 각 행사별 상세 페이지(`/map/[id]`) 고유 OpenGraph 태그 및 Twitter Card 자동 생성
- **구조화 데이터 (JSON-LD)**: 검색엔진 크롤러를 위한 Schema.org `Event`, `WebSite`, `Organization` 구조화 데이터 내장
- **사이트맵 자동 생성**: `/sitemap.xml`을 통한 전체 행사 페이지 색인 지원
- **다크 모드 / 라이트 모드**: `next-themes` 기반 테마 전환 지원 (지도 캔버스 명도 자동 튜닝 및 눈부심 방지)
- **접근성(A11y)**: 다이얼로그 포커스 트랩(`useDialogFocusTrap`), WAI-ARIA 속성 준수 및 키보드 네비게이션 대응

### 4. 고신뢰성 데이터 동기화 엔진
- **스냅샷 기반 격리 동기화**: TourAPI의 `searchFestival2` API로 현재·예정 행사를 수집하여 스테이징(Staging) 테이블에서 검증 후 무중단 반영
- **급감 방지 안전장치**: 수집된 데이터가 기존 활성 행사의 70% 미만으로 급감할 경우 운영 DB 반영을 중단하여 데이터 유실 원천 차단
- **좌표 및 날짜 보정**:
  - 한국 경위도 범위(위도 33~39.8, 경도 124~132) 밖이거나 위경도가 역전(Swapped)된 데이터 자동 감지 및 보정
  - KST(한국 표준시, UTC+9) 15:00 UTC 날짜 경계선 기준의 정확한 당일 행사 판별
- **분산 락 & 하트비트**: D1 데이터베이스 기반 소유권 락(`acquireInitializeLock`)과 하트비트 갱신을 통해 동시 동기화 충돌 방지
- **2단계 온디맨드 상세 수집**: 목록 수집 시에는 기본 정보만 빠르게 적재하고, 상세 조회 시 또는 5분 단위 백그라운드 크론을 통해 `detailCommon2`, `detailIntro2`, `detailInfo2`, `detailImage2`를 점진적으로 동기화 및 KV 캐시 반영

---

## 🛠 기술 스택 (Tech Stack)

| 구분 | 사용 기술 |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router, webpack mode), React 19, TypeScript |
| **Styling** | Tailwind CSS 3, Sass (SCSS), Framer Motion, Lucide React |
| **Platform** | Cloudflare Workers, OpenNext (`@opennextjs/cloudflare` 1.20.4) |
| **Database** | Cloudflare D1 (Serverless SQLite), Drizzle ORM |
| **Caching** | Cloudflare KV (`CULTURE_CACHE`) |
| **External APIs** | 공공데이터포털 한국관광공사 TourAPI (KorService2), 카카오 지도 SDK |
| **Virtualization** | @tanstack/react-virtual |
| **Testing** | Node.js Test Runner with `tsx` (TypeScript 기반 테스트 러너) |

---

## 📂 프로젝트 구조 (Project Structure)

```text
culture-walk/
├── src/
│   ├── app/                    # Next.js App Router (페이지 및 API 엔드포인트)
│   │   ├── about/              # 서비스 소개 페이지
│   │   ├── api/
│   │   │   ├── cultures/       # 행사 목록 조회 API (KV 캐싱 적용)
│   │   │   │   └── [id]/       # 행사 상세 조회 API (D1 + KV 캐싱)
│   │   │   ├── health/         # 서비스 상태 및 데이터 품질 모니터링 API
│   │   │   └── initialize/     # TourAPI 데이터 수동 동기화 엔드포인트
│   │   ├── contact/            # 문의 페이지
│   │   ├── map/                # 메인 지도 탐색 화면
│   │   │   └── [id]/           # 행사 상세 모달/시트 및 SEO 메타데이터
│   │   ├── privacy/            # 개인정보처리방침
│   │   ├── layout.tsx          # 루트 레이아웃 (SEO 메타데이터, 폰트, 공급자)
│   │   ├── page.tsx            # 메인 진입점 (/map 으로 리다이렉트)
│   │   └── sitemap.ts          # 동적 sitemap.xml 생성기
│   ├── cache/                  # Cloudflare KV 캐시 유틸리티 (목록/상세 캐싱)
│   ├── components/             # UI 컴포넌트
│   │   ├── BottomSheet/        # 하단 시트 컴포넌트 (모바일/데스크톱 반응형)
│   │   ├── Header/             # 상단 내비게이션 바 & 로고 & 테마 토글
│   │   ├── Map/                # 카카오맵 뷰, 마커, 줌/위치 컨트롤, 대시보드
│   │   ├── SideMenu/           # 사이드 드로어 메뉴
│   │   └── Toast/              # 전역 토스트 알림
│   ├── context/                # 전역 상태 (CultureContext, BottomSheetContext 등)
│   ├── db/                     # Drizzle ORM 스키마 정의 (`schema.ts`) 및 클라이언트
│   ├── hooks/                  # 커스텀 훅 (API 에러, 다이얼로그 포커스 등)
│   ├── server/                 # Cloudflare 바인딩 및 SQLite 에러 핸들러
│   ├── services/               # 핵심 도메인 로직 (동기화, 정규화, 분산 락, TourAPI 통신)
│   ├── styles/                 # 전역 스타일시트 및 Pretendard 폰트 세팅
│   ├── types/                  # 전역 TypeScript 타입 정의
│   └── utils/                  # 순수 유틸리티 (좌표 변환, 날짜, 정렬, Kakao SDK 로더)
├── db/
│   ├── migrations/             # D1 데이터베이스 마이그레이션 SQL 파일들
│   └── schema.sql              # 전체 스키마 참조본
├── tests/                      # 단위 및 통합 테스트 파일 (53개 테스트 통과)
├── worker.js                   # Cloudflare Worker 진입점 (OpenNext 연동 + Cron 트리거)
├── wrangler.jsonc              # Cloudflare Workers / D1 / KV / Cron 설정 파일
└── open-next.config.ts         # OpenNext Cloudflare 어댑터 설정
```

---

## 🚀 로컬 개발 환경 구축 (Getting Started)

### 1. 요구 사항
- **Node.js**: `v20.0.0` 이상
- **npm**: `v10.0.0` 이상

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
프로젝트 루트에 `.env.local` (또는 `.env`) 파일을 생성하고 다음 변수를 입력합니다:

```bash
cp .env.example .env.local
```

#### 필수 환경 변수
| 변수명 | 설명 | 예시 |
| :--- | :--- | :--- |
| `TOUR_API_BASE_URL` | 한국관광공사 TourAPI 엔드포인트 | `https://apis.data.go.kr/B551011/KorService2` |
| `TOUR_API_KEY` | 공공데이터포털 일반 인증키 (Decoding 키 권장) | `YOUR_TOUR_API_KEY` |
| `NEXT_PUBLIC_KAKAO_MAPS_APP_KEY` | 카카오 개발자 콘솔의 **JavaScript 키** | `YOUR_KAKAO_JAVASCRIPT_KEY` |
| `SYNC_TOKEN` | 동기화 API(`/api/initialize`) 보호용 비밀 토큰 | `임의의_보안_토큰` |

#### 선택 환경 변수 (SEO 및 부가 기능)
| 변수명 | 설명 | 예시 |
| :--- | :--- | :--- |
| `SITE_URL` | 서비스 기본 도메인 | `https://culturewalk.gangmin.dev` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 측정 ID | `G-XXXXXXXXXX` |
| `GOOGLE_SITE_VERIFICATION` | 구글 서치 콘솔 소유권 확인 토큰 | `검증_토큰` |
| `NAVER_SITE_VERIFICATION` | 네이버 서치어드바이저 소유권 확인 토큰 | `검증_토큰` |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | 구글 애드센스 클라이언트 ID | `ca-pub-xxxxxxxxxxxxxxxx` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 문의 페이지 노출용 이메일 | `contact@yourdomain.com` |

### 4. 로컬 D1 데이터베이스 마이그레이션
Cloudflare D1 로컬 SQLite 인스턴스에 테이블 스키마를 적용합니다:

```bash
npm run db:migrate:local
```

### 5. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하면 `/map` 화면으로 자동 이동합니다.

---

## ⚙️ 실행 스크립트 (NPM Scripts)

| 명령어 | 설명 |
| :--- | :--- |
| `npm run dev` | 로컬 개발 서버 실행 (`next dev --webpack`) |
| `npm run build` | 프로덕션 Next.js 빌드 (`next build --webpack`) |
| `npm run start` | 빌드된 Next.js 서버 실행 |
| `npm test` | 전체 테스트 스위트 실행 (`tsx --test tests/**/*.test.ts`) |
| `npm run typecheck` | TypeScript 정적 타입 검사 (`tsc --noEmit`) |
| `npm run lint` | ESLint 코드 스타일 및 규칙 검사 |
| `npm run db:migrate:local` | 로컬 Cloudflare D1 인스턴스에 마이그레이션 적용 |
| `npm run db:migrate:remote` | 원격 Cloudflare D1 프로덕션 DB에 마이그레이션 적용 |
| `npm run cf:build` | OpenNext를 이용한 Cloudflare Workers 빌드 |
| `npm run preview` | OpenNext 빌드 후 Wrangler 로컬 에뮬레이터 실행 |
| `npm run deploy` | OpenNext 빌드 후 Cloudflare Workers 프로덕션 배포 |
| `npm run cf:typegen` | Cloudflare Worker 환경변수/바인딩 타입 정의 갱신 |

---

## 📡 API 및 운영 가이드 (Operations)

### 1. 헬스체크 및 데이터 품질 모니터링 (`GET /api/health`)
데이터베이스와 동기화 상태의 무결성을 실시간 검증합니다.
- **반환 데이터**:
  - 총 데이터 수, 활성/비활성 행사 수, TourAPI 연동 행사 수
  - 정상 좌표, 위경도 전도 보정 좌표, 이상 좌표 수
  - 비정상 행사 기간(종료일 < 시작일 등) 유무
  - 캐시된 상세 정보 개수 및 최근 동기화 경과 시간(`ageHours`)
- **응답 코드**:
  - `200 OK`: 모든 품질 기준을 통과하고 최근 36시간 내 성공한 동기화가 존재하는 경우
  - `503 Service Unavailable`: D1 바인딩 누락, 비정상 데이터 검출, 또는 최근 36시간 내 동기화 성공 이력이 없는 경우

### 2. 문화행사 목록 조회 (`GET /api/cultures`)
- 현재 날짜(KST 기준) 이후 종료되는 모든 활성 문화행사 목록을 반환합니다.
- Cloudflare KV(`CULTURE_CACHE`)를 활용하여 10분간 엣지 캐싱되며, 브라우저 `Cache-Control` 헤더를 통해 고속 응답을 지원합니다.

### 3. 문화행사 상세 조회 (`GET /api/cultures/[id]`)
- 특정 행사의 상세 정보(프로그램 소개, 추가 이미지, 예매처, 주최측 정보 등)를 반환합니다.
- 상세 정보가 미완료 상태이거나 원본 수정일이 변경된 경우 백그라운드 갱신 요청을 등록하고 최신 상태를 유지합니다.

### 4. 수동 데이터 동기화 (`POST /api/initialize`)
- 헤더에 `x-sync-token: <SYNC_TOKEN>`을 포함하여 호출하면 TourAPI로부터 최신 행사를 즉시 동기화합니다.
- 분산 락에 의해 이미 동기화가 진행 중인 경우 `409 Conflict`를 반환합니다.

---

## ☁️ Cloudflare 배포 및 스케줄러 (Deployment & Crons)

본 프로젝트는 Cloudflare Workers 환경에서 OpenNext 어댑터를 통해 구동됩니다.

### 1. 배포 전 리소스 구성
1. Cloudflare 대시보드 또는 CLI로 D1 데이터베이스 생성:
   ```bash
   npx wrangler d1 create culture-walk-db
   ```
2. Cloudflare KV 네임스페이스 생성:
   ```bash
   npx wrangler kv namespace create CULTURE_CACHE
   npx wrangler kv namespace create CULTURE_CACHE --preview
   ```
3. `wrangler.jsonc` 파일에 생성된 `database_id`와 KV `id`를 반영합니다.

4. 프로덕션 시크릿(Secret) 등록:
   ```bash
   npx wrangler secret put TOUR_API_KEY
   npx wrangler secret put SYNC_TOKEN
   ```

5. 원격 D1 데이터베이스에 마이그레이션 적용:
   ```bash
   npm run db:migrate:remote
   ```

### 2. 애플리케이션 배포
```bash
npm run deploy
```

### 3. 백그라운드 Cron 트리거 (`wrangler.jsonc`, `worker.js`)
Cloudflare Worker 진입점(`worker.js`)에 의해 다음 스케줄 작업이 자동으로 수행됩니다:
- **전체 스냅샷 동기화 (`10 19,20 * * *`)**:
  - UTC 19:10 (KST 04:10): 일일 정기 전체 행사 스냅샷 동기화
  - UTC 20:10 (KST 05:10): 이전 동기화가 실패했거나 누락된 경우를 위한 자동 복구(Recovery) 동기화
- **상세 정보 점진적 갱신 (`2,7,12,17,... * * * *`)**:
  - 5분 주기 Cron으로 캐시되지 않았거나 오래된 행사의 상세 데이터(`detailCommon2` 등)를 순차적으로 갱신하고 KV 캐시 버전을 갱신

---

## 🧪 테스트 (Testing)

53개의 단위/통합 테스트를 통해 데이터 정합성과 사용자 플로우를 검증합니다.

```bash
npm test
```

### 주요 테스트 범위
- **좌표 및 정규화 (`geo.test.ts`, `cultureSyncNormalize.test.ts`)**: 위경도 역전 좌표 보정, 대한민국 영역 검증, 이상 날짜 제외
- **동기화 파이프라인 (`cultureSyncRepository.test.ts`, `cultureSyncLock.test.ts`)**: 스테이징 삽입, 변경분만 갱신, 소프트 삭제, 분산 락 획득/반환/하트비트
- **스케줄 및 복구 (`cultureSyncSchedule.test.ts`)**: 정기 동기화 및 36시간 초과 복구 동기화 판정
- **Kakao Maps SDK 라이프사이클 (`kakaoMapsSdk.test.ts`)**: 단일 프로미스 공유, 타임아웃, 네트워크 실패 시 리셋
- **탐색 상태 보존 (`exploreState.test.ts`, `mapRoute.test.ts`)**: URL 직렬화/역직렬화 및 검색/필터 복원
- **SEO & 테마 (`jsonLd.test.ts`, `themeTokens.test.ts`)**: JSON-LD 문자열 이스케이프 및 다크모드 대비율

---

## 📄 라이선스 (License)

This project is licensed under the MIT License.
공공데이터는 [공공데이터포털](https://www.data.go.kr) 및 [한국관광공사 TourAPI](https://knto.or.kr)의 이용 약관을 준수합니다.
