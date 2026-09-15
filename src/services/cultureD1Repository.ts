import type { CultureTourApiDetailsRow } from '@/db/schema';
import type { CultureContentRow } from '@/services/cultureService';
import { normalizeCultureClassification, normalizeCultureCoordinates } from '@/services/cultureService';
import type { CultureListItem } from '@/types/culture';
import { toDateOrNull } from '@/utils/dateUtils';

export type CultureD1Row = Record<string, unknown>;

export const CULTURE_CONTENT_SELECT = `
  cultures.id AS id,
  cultures.source_key AS "sourceKey",
  cultures.classification AS classification,
  cultures.date AS date,
  cultures.end_date AS "endDate",
  cultures.etc_description AS "etcDescription",
  cultures.gu_name AS "guName",
  cultures.homepage_detail_address AS "homepageDetailAddress",
  cultures.is_free AS "isFree",
  cultures.lat AS lat,
  cultures.lng AS lng,
  cultures.main_image AS "mainImage",
  cultures.homepage_address AS "homepageAddress",
  cultures.organization_name AS "organizationName",
  cultures.place AS place,
  cultures.performer_information AS "performerInformation",
  cultures.program_introduction AS "programIntroduction",
  cultures.registration_date AS "registrationDate",
  cultures.start_date AS "startDate",
  cultures.theme_classification AS "themeClassification",
  cultures.register AS register,
  cultures.title AS title,
  cultures.use_fee AS "useFee",
  cultures.use_target AS "useTarget",
  cultures.created_at AS "createdAt",
  cultures.updated_at AS "updatedAt"
`;

export const CULTURE_DETAIL_SELECT = `
  details.source_key AS "detailSourceKey",
  details.source_modified_at AS "detailSourceModifiedAt",
  details.common_json AS "detailCommonJson",
  details.intro_json AS "detailIntroJson",
  details.info_json AS "detailInfoJson",
  details.images_json AS "detailImagesJson",
  details.is_complete AS "detailIsComplete",
  details.synced_at AS "detailSyncedAt"
`;

const toNullableString = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
};

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toInteger = (value: unknown) => {
  const parsed = toNullableNumber(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
};

export const toCultureContentRow = (row: CultureD1Row): CultureContentRow | null => {
  const id = toInteger(row.id);
  const createdAt = toNullableString(row.createdAt);
  const updatedAt = toNullableString(row.updatedAt);
  if (id === null || !createdAt || !updatedAt) return null;

  return {
    id,
    sourceKey: toNullableString(row.sourceKey),
    classification: toNullableString(row.classification),
    date: toNullableString(row.date),
    endDate: toNullableString(row.endDate),
    etcDescription: toNullableString(row.etcDescription),
    guName: toNullableString(row.guName),
    homepageDetailAddress: toNullableString(row.homepageDetailAddress),
    isFree: toNullableString(row.isFree),
    lat: toNullableNumber(row.lat),
    lng: toNullableNumber(row.lng),
    mainImage: toNullableString(row.mainImage),
    homepageAddress: toNullableString(row.homepageAddress),
    organizationName: toNullableString(row.organizationName),
    place: toNullableString(row.place),
    performerInformation: toNullableString(row.performerInformation),
    programIntroduction: toNullableString(row.programIntroduction),
    registrationDate: toNullableString(row.registrationDate),
    startDate: toNullableString(row.startDate),
    themeClassification: toNullableString(row.themeClassification),
    register: toNullableString(row.register),
    title: toNullableString(row.title),
    useFee: toNullableString(row.useFee),
    useTarget: toNullableString(row.useTarget),
    createdAt,
    updatedAt,
  };
};

export const toCultureTourApiDetailsRow = (row: CultureD1Row): CultureTourApiDetailsRow | undefined => {
  if (!row.detailSourceKey) return undefined;

  return {
    sourceKey: String(row.detailSourceKey),
    sourceModifiedAt: row.detailSourceModifiedAt ? String(row.detailSourceModifiedAt) : null,
    commonJson: String(row.detailCommonJson ?? '{}'),
    introJson: String(row.detailIntroJson ?? '{}'),
    infoJson: String(row.detailInfoJson ?? '[]'),
    imagesJson: String(row.detailImagesJson ?? '[]'),
    isComplete: Boolean(Number(row.detailIsComplete ?? 0)),
    syncedAt: String(row.detailSyncedAt ?? ''),
  };
};

export const toCultureListItem = (row: CultureD1Row): CultureListItem | null => {
  const id = Number(row.id);
  const lat = Number(row.lat);
  const lng = Number(row.lng);
  const startDate = toDateOrNull(String(row.startDate ?? ''));
  const endDate = toDateOrNull(String(row.endDate ?? row.startDate ?? ''));
  if (!Number.isInteger(id) || !Number.isFinite(lat) || !Number.isFinite(lng) || !startDate || !endDate) return null;

  const coordinates = normalizeCultureCoordinates(lat, lng);
  return {
    id,
    classification: normalizeCultureClassification(String(row.classification ?? '')),
    endDate,
    guName: String(row.guName ?? ''),
    isFree: String(row.isFree ?? ''),
    lat: coordinates.lat,
    lng: coordinates.lng,
    mainImage: String(row.mainImage ?? '/assets/images/logo.svg'),
    place: String(row.place ?? ''),
    startDate,
    title: String(row.title ?? ''),
    useFee: String(row.useFee ?? ''),
  };
};
