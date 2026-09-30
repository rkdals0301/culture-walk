import type { TelemetryRateLimitBinding } from './runtimeTypes';

export const isTelemetryRequestRateLimited = async (
  binding: TelemetryRateLimitBinding | undefined,
  key: string
) => {
  if (!binding) return false;

  try {
    return !(await binding.limit({ key })).success;
  } catch {
    // Telemetry must not affect the application when the optional limiter is unavailable.
    return false;
  }
};
