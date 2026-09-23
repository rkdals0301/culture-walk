import type { NewCultureRow } from '@/db/schema';

const UNKNOWN_FEE_PATTERN = /정보\s*없음|확인\s*필요|미정|문의/i;

const ratio = (count: number, total: number) =>
  total > 0 ? Math.round((count / total) * 10_000) / 10_000 : 0;

export interface CultureSnapshotQualityReport {
  fetchedCount: number;
  normalizedCount: number;
  publishedCandidateCount: number;
  duplicateCount: number;
  invalidCoordinateCount: number;
  invalidDateCount: number;
  missingRequiredFieldCount: number;
  missingImageCount: number;
  missingImageRatio: number;
  missingPlaceCount: number;
  missingPlaceRatio: number;
  unknownFeeCount: number;
  unknownFeeRatio: number;
  warnings: string[];
}

export const buildCultureSnapshotQualityReport = ({
  fetchedCount,
  normalizedRows,
  deduplicatedRows,
  invalidCoordinateCount,
  invalidDateCount,
  missingRequiredFieldCount,
}: {
  fetchedCount: number;
  normalizedRows: readonly NewCultureRow[];
  deduplicatedRows: readonly NewCultureRow[];
  invalidCoordinateCount: number;
  invalidDateCount: number;
  missingRequiredFieldCount: number;
}): CultureSnapshotQualityReport => {
  const total = deduplicatedRows.length;
  const duplicateCount = Math.max(0, normalizedRows.length - total);
  const missingImageCount = deduplicatedRows.filter(row => !row.mainImage?.trim()).length;
  const missingPlaceCount = deduplicatedRows.filter(row => !row.place?.trim()).length;
  const unknownFeeCount = deduplicatedRows.filter(row => {
    const fee = [row.isFree ?? '', row.useFee ?? ''].join(' ').trim();
    return fee.length === 0 || UNKNOWN_FEE_PATTERN.test(fee);
  }).length;
  const missingImageRatio = ratio(missingImageCount, total);
  const missingPlaceRatio = ratio(missingPlaceCount, total);
  const unknownFeeRatio = ratio(unknownFeeCount, total);
  const warnings: string[] = [];

  if (missingImageRatio >= 0.4) warnings.push('missing-image-ratio-high');
  if (missingPlaceRatio >= 0.1) warnings.push('missing-place-ratio-high');
  if (unknownFeeRatio >= 0.5) warnings.push('unknown-fee-ratio-high');
  if (invalidCoordinateCount > 0) warnings.push('invalid-coordinates-present');
  if (invalidDateCount > 0) warnings.push('invalid-dates-present');
  if (missingRequiredFieldCount > 0) warnings.push('missing-required-fields-present');
  if (duplicateCount > 0) warnings.push('duplicates-present');

  return {
    fetchedCount,
    normalizedCount: normalizedRows.length,
    publishedCandidateCount: total,
    duplicateCount,
    invalidCoordinateCount,
    invalidDateCount,
    missingRequiredFieldCount,
    missingImageCount,
    missingImageRatio,
    missingPlaceCount,
    missingPlaceRatio,
    unknownFeeCount,
    unknownFeeRatio,
    warnings,
  };
};
