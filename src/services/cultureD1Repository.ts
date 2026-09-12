import type { CultureTourApiDetailsRow } from '@/db/schema';
import type { CultureContentRow } from '@/services/cultureService';
import { normalizeCultureClassification, normalizeCultureCoordinates } from '@/services/cultureService';
import type { CultureListItem } from '@/types/culture';
import { toDateOrNow } from '@/utils/dateUtils';

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

export const toCultureContentRow = (row: CultureD1Row) => row as unknown as CultureContentRow;

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
  if (!Number.isInteger(id) || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const coordinates = normalizeCultureCoordinates(lat, lng);
  return {
    id,
    classification: normalizeCultureClassification(String(row.classification ?? '')),
    endDate: toDateOrNow(String(row.endDate ?? row.startDate ?? '')),
    guName: String(row.guName ?? ''),
    isFree: String(row.isFree ?? ''),
    lat: coordinates.lat,
    lng: coordinates.lng,
    mainImage: String(row.mainImage ?? '/assets/images/logo.svg'),
    place: String(row.place ?? ''),
    startDate: toDateOrNow(String(row.startDate ?? '')),
    title: String(row.title ?? ''),
    useFee: String(row.useFee ?? ''),
  };
};
