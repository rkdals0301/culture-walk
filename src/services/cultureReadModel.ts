import {
  type CultureCacheBinding,
  readCultureDetailCache,
  writeCultureDetailCache,
} from '@/cache/kv';
import type { CultureTourApiDetailsRow } from '@/db/schema';
import { getWorkerEnv } from '@/server/cloudflare';
import {
  createCultureListItemRevision,
  getCulturePublicListSnapshot,
} from '@/services/cultureList';
import {
  type CultureContentRow,
  mapCultureListItemToCulture,
  mapCultureRowToCulture,
  normalizeCultureClassification,
  normalizeCultureCoordinates,
} from '@/services/cultureService';
import type { D1Binding } from '@/services/cultureSyncTypes';
import { parseStoredTourApiDetails } from '@/services/tourApiDetails';
import type { Culture, CultureListItem } from '@/types/culture';
import { getKoreaDateStartIso, toDateOrNow } from '@/utils/dateUtils';

export type CulturePublicReadSource = 'kv-detail-cache' | 'kv-read-model' | 'd1-read-through';

export interface CulturePublicReadResult {
  culture: Culture | null;
  source: CulturePublicReadSource | null;
  readModelAvailable: boolean;
}

type CulturePublicReadOptions = {
  cache?: CultureCacheBinding;
  d1?: D1Binding;
};

const DETAIL_READ_THROUGH_TTL_SECONDS = 60 * 60 * 24 * 7;

const readCultureDetailFromD1 = async (d1: D1Binding, id: number) => {
  const result = await d1
    .prepare(
      `SELECT
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
         cultures.updated_at AS "updatedAt",
         details.source_key AS "detailSourceKey",
         details.source_modified_at AS "detailSourceModifiedAt",
         details.common_json AS "detailCommonJson",
         details.intro_json AS "detailIntroJson",
         details.info_json AS "detailInfoJson",
         details.images_json AS "detailImagesJson",
         details.is_complete AS "detailIsComplete",
         details.synced_at AS "detailSyncedAt"
       FROM cultures
       LEFT JOIN culture_tour_api_details details
         ON details.source_key = cultures.source_key
        AND details.is_complete = 1
        AND details.source_modified_at IS cultures.registration_date
       WHERE cultures.id = ?
         AND cultures.is_active = 1
         AND cultures.end_date >= ?
       LIMIT 1`
    )
    .bind(id, getKoreaDateStartIso())
    .all();

  const row = result.results?.[0];
  if (!row) return null;

  const contentRow = row as unknown as CultureContentRow;
  const detailRow = row.detailSourceKey
    ? ({
        sourceKey: String(row.detailSourceKey),
        sourceModifiedAt: row.detailSourceModifiedAt ? String(row.detailSourceModifiedAt) : null,
        commonJson: String(row.detailCommonJson ?? '{}'),
        introJson: String(row.detailIntroJson ?? '{}'),
        infoJson: String(row.detailInfoJson ?? '[]'),
        imagesJson: String(row.detailImagesJson ?? '[]'),
        isComplete: Boolean(Number(row.detailIsComplete ?? 0)),
        syncedAt: String(row.detailSyncedAt ?? ''),
      } satisfies CultureTourApiDetailsRow)
    : undefined;
  const culture = mapCultureRowToCulture(
    contentRow,
    detailRow ? parseStoredTourApiDetails(detailRow) : undefined
  );
  const coordinates = normalizeCultureCoordinates(Number(row.lat), Number(row.lng));
  const listItem: CultureListItem = {
    id: Number(row.id),
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

  return {
    culture,
    revision: createCultureListItemRevision(listItem, row.registrationDate ? String(row.registrationDate) : null),
  };
};

/**
 * Public reads are KV-first. Paid D1 is used only as a read-through recovery
 * source when the rich detail cache is missing or stale, and successful reads
 * repopulate KV so subsequent requests stay on the fast path.
 */
export const getCulturePublicRead = async (
  id: number,
  options?: CulturePublicReadOptions
): Promise<CulturePublicReadResult> => {
  const env = options ? null : await getWorkerEnv();
  const cache = options?.cache ?? (env?.CULTURE_CACHE as CultureCacheBinding | undefined);
  const d1 = options?.d1 ?? (env?.DB as D1Binding | undefined);
  const [detail, snapshot] = await Promise.all([
    readCultureDetailCache(id, cache),
    options ? getCulturePublicListSnapshot({ cache, d1 }) : getCulturePublicListSnapshot(),
  ]);
  const item = snapshot?.items.find(culture => culture.id === id) ?? null;
  const itemRevision = snapshot?.revisions[String(id)];
  const detailMatchesReadModel =
    detail?.culture?.id === id &&
    (!itemRevision || detail.cacheVersion === itemRevision);
  if (detailMatchesReadModel) {
    return {
      culture: detail.culture,
      source: 'kv-detail-cache',
      readModelAvailable: true,
    };
  }

  if (d1) {
    try {
      const readThrough = await readCultureDetailFromD1(d1, id);
      if (readThrough) {
        if (cache) {
          const cacheVersion = itemRevision ?? readThrough.revision;
          await writeCultureDetailCache(
            id,
            cacheVersion,
            readThrough.culture,
            DETAIL_READ_THROUGH_TTL_SECONDS,
            cache
          );
        }

        return {
          culture: readThrough.culture,
          source: 'd1-read-through',
          readModelAvailable: Boolean(snapshot),
        };
      }
    } catch (error) {
      console.error(`[read-model] detail D1 read-through failed id=${id}`, error);
    }
  }

  if (!snapshot) {
    return {
      culture: null,
      source: null,
      readModelAvailable: false,
    };
  }

  if (!item) {
    return {
      culture: null,
      source: null,
      readModelAvailable: true,
    };
  }

  return {
    culture: mapCultureListItemToCulture(item),
    source: 'kv-read-model',
    readModelAvailable: true,
  };
};
