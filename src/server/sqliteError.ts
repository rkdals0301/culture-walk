const D1_DAILY_ROW_READ_LIMIT_MESSAGE = "exceeded D1's free tier daily row read limit";
const D1_DAILY_ROW_WRITE_LIMIT_MESSAGE = "exceeded D1's free tier daily row write limit";

const hasNestedErrorMessage = (error: unknown, target: string) => {
  const visited = new Set<object>();
  let current: unknown = error;

  while (current) {
    const message = current instanceof Error ? current.message : String(current);
    if (message.includes(target)) {
      return true;
    }

    if (typeof current !== 'object') {
      return false;
    }

    if (visited.has(current)) {
      return false;
    }
    visited.add(current);
    current = (current as { cause?: unknown }).cause;
  }

  return false;
};

export const hasD1DailyRowReadLimitError = (error: unknown) =>
  hasNestedErrorMessage(error, D1_DAILY_ROW_READ_LIMIT_MESSAGE);

export const hasD1DailyRowWriteLimitError = (error: unknown) =>
  hasNestedErrorMessage(error, D1_DAILY_ROW_WRITE_LIMIT_MESSAGE);
