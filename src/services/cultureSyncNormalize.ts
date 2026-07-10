import { NewCultureRow } from '@/db/schema';

import { createCultureSourceKey } from './cultureIdentity';

import {
  KOREA_LAT_MAX,
  KOREA_LAT_MIN,
  KOREA_LNG_MAX,
  KOREA_LNG_MIN,
  MIN_VALID_COORDINATE_COUNT,
  MIN_VALID_COORDINATE_RATIO,
} from './cultureSyncTypes';

export const deduplicateCultureRows = (rows: NewCultureRow[]) => {
  const deduped = new Map<string, NewCultureRow>();
  let duplicateCount = 0;

  for (const row of rows) {
    const key = row.sourceKey ?? createCultureSourceKey(row);
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

  if (looksLikeKoreaLat(lat) && looksLikeKoreaLng(lng)) {
    return { lat, lng, status: 'kept' };
  }

  return { lat: null, lng: null, status: 'invalid' };
};

const hasRequiredFields = (row: NewCultureRow) => Boolean(row.title && row.startDate && row.endDate);

const hasPlausibleDates = (row: NewCultureRow, currentYear: number) => {
  if (!row.startDate || !row.endDate) {
    return false;
  }

  const startDate = new Date(row.startDate);
  const endDate = new Date(row.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return false;
  }

  const minimumYear = 2000;
  const maximumYear = currentYear + 5;
  return (
    startDate.getUTCFullYear() >= minimumYear &&
    endDate.getUTCFullYear() >= minimumYear &&
    startDate.getUTCFullYear() <= maximumYear &&
    endDate.getUTCFullYear() <= maximumYear &&
    endDate.getTime() >= startDate.getTime()
  );
};

export const normalizeAndValidateCultureRows = (rows: NewCultureRow[], now = new Date()) => {
  let swappedCount = 0;
  let validCoordinateCount = 0;
  let invalidCoordinateCount = 0;
  let invalidDateCount = 0;
  let missingRequiredFieldCount = 0;
  const normalizedRows: NewCultureRow[] = [];

  for (const row of rows) {
    if (!hasRequiredFields(row)) {
      missingRequiredFieldCount += 1;
      continue;
    }

    if (!hasPlausibleDates(row, now.getUTCFullYear())) {
      invalidDateCount += 1;
      continue;
    }

    const normalized = normalizeCoordinates(row.lat ?? null, row.lng ?? null);

    if (normalized.status === 'swapped') {
      swappedCount += 1;
      validCoordinateCount += 1;
    } else if (normalized.status === 'kept') {
      validCoordinateCount += 1;
    } else {
      invalidCoordinateCount += 1;
    }

    const normalizedRow = { ...row, lat: normalized.lat, lng: normalized.lng };
    normalizedRows.push({ ...normalizedRow, sourceKey: createCultureSourceKey(normalizedRow) });
  }

  const validRatio = normalizedRows.length > 0 ? validCoordinateCount / normalizedRows.length : 0;

  if (validCoordinateCount < MIN_VALID_COORDINATE_COUNT || validRatio < MIN_VALID_COORDINATE_RATIO) {
    throw new Error(
      `좌표 데이터 품질이 기준 미달입니다. valid=${validCoordinateCount}, invalid=${invalidCoordinateCount}, swapped=${swappedCount}, total=${normalizedRows.length}`
    );
  }

  console.info(
    `좌표 정규화 완료: valid=${validCoordinateCount}, invalid=${invalidCoordinateCount}, swapped=${swappedCount}, total=${normalizedRows.length}`
  );

  return {
    rows: normalizedRows,
    invalidCoordinateCount,
    invalidDateCount,
    missingRequiredFieldCount,
    swappedCoordinateCount: swappedCount,
  };
};
