import { NewCultureRow } from '@/db/schema';
import { getWorkerEnv } from '@/server/cloudflare';

export const INITIAL_START_INDEX = 1;
export const PAGE_SIZE = 1000;
export const BATCH_SIZE = 4;
export const RETRY_LIMIT = 3;
export const INITIALIZE_LOCK_TABLE = 'initialize_sync_locks';
export const INITIALIZE_LOCK_NAME = 'initialize-sync-lock';
export const INITIALIZE_LOCK_TTL_MINUTES = 30;
export const STAGING_TABLE = 'culture_sync_staging';
export const MIN_VALID_COORDINATE_COUNT = 5;
export const MIN_VALID_COORDINATE_RATIO = 0.03;
export const MAX_SKIPPED_ROW_RATIO = 0.01;
export const KOREA_LAT_MIN = 33;
export const KOREA_LAT_MAX = 39.8;
export const KOREA_LNG_MIN = 124;
export const KOREA_LNG_MAX = 132;

export type WorkerEnv = Awaited<ReturnType<typeof getWorkerEnv>>;
export type InsertStats = { inserted: number; skipped: number };
export type SyncResult = {
  fetched: number;
  inserted: number;
  skipped: number;
  normalized: number;
  deduplicated: number;
};

export type D1AllResult = { results?: Array<Record<string, unknown>> };
export type D1Statement = {
  bind: (...values: unknown[]) => D1Statement;
  run: () => Promise<unknown>;
  all: () => Promise<D1AllResult>;
};
export type D1Binding = {
  prepare: (query: string) => D1Statement;
  batch?: (statements: D1Statement[]) => Promise<unknown[]>;
};

export const STAGING_COLUMNS = [
  'classification',
  'date',
  'end_date',
  'etc_description',
  'gu_name',
  'homepage_detail_address',
  'is_free',
  'lat',
  'lng',
  'main_image',
  'homepage_address',
  'organization_name',
  'place',
  'performer_information',
  'program_introduction',
  'registration_date',
  'start_date',
  'theme_classification',
  'register',
  'title',
  'use_fee',
  'use_target',
] as const;

export const toStagingValues = (row: NewCultureRow) => [
  row.classification ?? null,
  row.date ?? null,
  row.endDate ?? null,
  row.etcDescription ?? null,
  row.guName ?? null,
  row.homepageDetailAddress ?? null,
  row.isFree ?? null,
  row.lat ?? null,
  row.lng ?? null,
  row.mainImage ?? null,
  row.homepageAddress ?? null,
  row.organizationName ?? null,
  row.place ?? null,
  row.performerInformation ?? null,
  row.programIntroduction ?? null,
  row.registrationDate ?? null,
  row.startDate ?? null,
  row.themeClassification ?? null,
  row.register ?? null,
  row.title ?? null,
  row.useFee ?? null,
  row.useTarget ?? null,
];
