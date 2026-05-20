import { NewCultureRow } from '@/db/schema';

import {
  KOREA_LAT_MAX,
  KOREA_LAT_MIN,
  KOREA_LNG_MAX,
  KOREA_LNG_MIN,
  MIN_VALID_COORDINATE_COUNT,
  MIN_VALID_COORDINATE_RATIO,
} from './cultureSyncTypes';

const toDedupeKey = (row: NewCultureRow) =>
  [
    row.title ?? '',
    row.startDate ?? '',
    row.endDate ?? '',
    row.place ?? '',
    row.guName ?? '',
    row.organizationName ?? '',
    row.lat == null ? '' : row.lat.toFixed(6),
    row.lng == null ? '' : row.lng.toFixed(6),
  ].join('||');

export const deduplicateCultureRows = (rows: NewCultureRow[]) => {
  const deduped = new Map<string, NewCultureRow>();
  let duplicateCount = 0;

  for (const row of rows) {
    const key = toDedupeKey(row);
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, row);
      continue;
    }

    duplicateCount += 1;
    const existingRegistrationDate = existing.registrationDate ?? '';
    const nextRegistrationDate = row.registrationDate ?? '';

    if (nextRegistrationDate > existingRegistrationDate) {
      deduped.set(key, row);
    }
  }

  if (duplicateCount > 0) {
    console.info(`중복 이벤트 제거 완료: duplicates=${duplicateCount}, unique=${deduped.size}`);
  }

  return Array.from(deduped.values());
};

const isBetween = (value: number, min: number, max: number) => value >= min && value <= max;
const looksLikeKoreaLat = (value: number) => isBetween(value, KOREA_LAT_MIN, KOREA_LAT_MAX);
const looksLikeKoreaLng = (value: number) => isBetween(value, KOREA_LNG_MIN, KOREA_LNG_MAX);

const normalizeCoordinates = (
  lat: number | null,
  lng: number | null
): { lat: number | null; lng: number | null; status: 'kept' | 'swapped' | 'invalid' } => {
  const hasLat = typeof lat === 'number' && Number.isFinite(lat);
  const hasLng = typeof lng === 'number' && Number.isFinite(lng);

  if (!hasLat || !hasLng) {
    return { lat: null, lng: null, status: 'invalid' };
  }

  if (looksLikeKoreaLng(lat) && looksLikeKoreaLat(lng)) {
    return { lat: lng, lng: lat, status: 'swapped' };
  }

  const isValidGlobalLat = isBetween(lat, -90, 90);
  const isValidGlobalLng = isBetween(lng, -180, 180);

  if (!isValidGlobalLat || !isValidGlobalLng) {
    return { lat: null, lng: null, status: 'invalid' };
  }

  return { lat, lng, status: 'kept' };
};

export const normalizeAndValidateCultureRows = (rows: NewCultureRow[]) => {
  let swappedCount = 0;
  let validCoordinateCount = 0;
  let invalidCoordinateCount = 0;

  const normalizedRows = rows.map(row => {
    const normalized = normalizeCoordinates(row.lat ?? null, row.lng ?? null);

    if (normalized.status === 'swapped') {
      swappedCount += 1;
      validCoordinateCount += 1;
    } else if (normalized.status === 'kept') {
      validCoordinateCount += 1;
    } else {
      invalidCoordinateCount += 1;
    }

    return { ...row, lat: normalized.lat, lng: normalized.lng };
  });

  const validRatio = validCoordinateCount / normalizedRows.length;

  if (validCoordinateCount < MIN_VALID_COORDINATE_COUNT || validRatio < MIN_VALID_COORDINATE_RATIO) {
    throw new Error(
      `좌표 데이터 품질이 기준 미달입니다. valid=${validCoordinateCount}, invalid=${invalidCoordinateCount}, swapped=${swappedCount}, total=${normalizedRows.length}`
    );
  }

  console.info(
    `좌표 정규화 완료: valid=${validCoordinateCount}, invalid=${invalidCoordinateCount}, swapped=${swappedCount}, total=${normalizedRows.length}`
  );

  return normalizedRows;
};
