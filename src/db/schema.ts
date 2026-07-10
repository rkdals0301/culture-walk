import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const cultures = sqliteTable(
  'cultures',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    sourceKey: text('source_key'),
    classification: text('classification'),
    date: text('date'),
    endDate: text('end_date'),
    etcDescription: text('etc_description'),
    guName: text('gu_name'),
    homepageDetailAddress: text('homepage_detail_address'),
    isFree: text('is_free'),
    lat: real('lat'),
    lng: real('lng'),
    mainImage: text('main_image'),
    homepageAddress: text('homepage_address'),
    organizationName: text('organization_name'),
    place: text('place'),
    performerInformation: text('performer_information'),
    programIntroduction: text('program_introduction'),
    registrationDate: text('registration_date'),
    startDate: text('start_date'),
    themeClassification: text('theme_classification'),
    register: text('register'),
    title: text('title'),
    useFee: text('use_fee'),
    useTarget: text('use_target'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    lastSeenAt: text('last_seen_at'),
    deactivatedAt: text('deactivated_at'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  table => ({
    sourceKeyIdx: uniqueIndex('cultures_source_key_idx').on(table.sourceKey),
    startDateIdx: index('cultures_start_date_idx').on(table.startDate),
    endDateIdx: index('cultures_end_date_idx').on(table.endDate),
    activeEndDateIdx: index('cultures_active_end_date_idx').on(table.isActive, table.endDate),
  })
);

export const cultureSyncRuns = sqliteTable(
  'culture_sync_runs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    trigger: text('trigger').notNull(),
    status: text('status').notNull(),
    fetchedCount: integer('fetched_count').notNull().default(0),
    normalizedCount: integer('normalized_count').notNull().default(0),
    stagedCount: integer('staged_count').notNull().default(0),
    insertedCount: integer('inserted_count').notNull().default(0),
    updatedCount: integer('updated_count').notNull().default(0),
    reactivatedCount: integer('reactivated_count').notNull().default(0),
    deactivatedCount: integer('deactivated_count').notNull().default(0),
    skippedCount: integer('skipped_count').notNull().default(0),
    errorMessage: text('error_message'),
    startedAt: text('started_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    completedAt: text('completed_at'),
  },
  table => ({
    startedAtIdx: index('culture_sync_runs_started_at_idx').on(table.startedAt),
  })
);

export type CultureRow = typeof cultures.$inferSelect;
export type NewCultureRow = typeof cultures.$inferInsert;
