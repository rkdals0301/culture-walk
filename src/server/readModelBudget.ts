export const CULTURE_READ_MODEL_MAX_BYTES = 2_000_000;
export const CULTURE_READ_MODEL_WATCH_RATIO = 0.75;

export type CultureReadModelBudgetStatus = 'unknown' | 'healthy' | 'watch' | 'exceeded';

export interface CultureReadModelBudgetAssessment {
  status: CultureReadModelBudgetStatus;
  maxBytes: number;
  watchAtBytes: number;
  utilizationRatio: number | null;
  utilizationPercent: number | null;
  bytesRemaining: number | null;
  bytesPerItem: number | null;
  estimatedItemsAtBudget: number | null;
}

export const assessCultureReadModelBudget = (
  serializedBytes: number | null,
  itemCount: number
): CultureReadModelBudgetAssessment => {
  const watchAtBytes = Math.round(CULTURE_READ_MODEL_MAX_BYTES * CULTURE_READ_MODEL_WATCH_RATIO);

  if (serializedBytes === null || !Number.isFinite(serializedBytes) || serializedBytes < 0) {
    return {
      status: 'unknown',
      maxBytes: CULTURE_READ_MODEL_MAX_BYTES,
      watchAtBytes,
      utilizationRatio: null,
      utilizationPercent: null,
      bytesRemaining: null,
      bytesPerItem: null,
      estimatedItemsAtBudget: null,
    };
  }

  const utilizationRatio = serializedBytes / CULTURE_READ_MODEL_MAX_BYTES;
  const bytesPerItem = itemCount > 0 ? serializedBytes / itemCount : null;

  return {
    status:
      serializedBytes > CULTURE_READ_MODEL_MAX_BYTES
        ? 'exceeded'
        : serializedBytes >= watchAtBytes
          ? 'watch'
          : 'healthy',
    maxBytes: CULTURE_READ_MODEL_MAX_BYTES,
    watchAtBytes,
    utilizationRatio: Math.round(utilizationRatio * 10_000) / 10_000,
    utilizationPercent: Math.round(utilizationRatio * 10_000) / 100,
    bytesRemaining: Math.max(0, CULTURE_READ_MODEL_MAX_BYTES - serializedBytes),
    bytesPerItem: bytesPerItem === null ? null : Math.round(bytesPerItem * 10) / 10,
    estimatedItemsAtBudget:
      bytesPerItem && bytesPerItem > 0
        ? Math.floor(CULTURE_READ_MODEL_MAX_BYTES / bytesPerItem)
        : null,
  };
};
