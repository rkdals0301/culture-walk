import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const cultures = sqliteTable(
  'cultures',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
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
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  table => ({
    startDateIdx: index('cultures_start_date_idx').on(table.startDate),
    endDateIdx: index('cultures_end_date_idx').on(table.endDate),
  })
);

export type CultureRow = typeof cultures.$inferSelect;
export type NewCultureRow = typeof cultures.$inferInsert;
