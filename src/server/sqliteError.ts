const SQLITE_MISSING_TABLE_PREFIX = 'no such table:';
const D1_DAILY_ROW_READ_LIMIT_MESSAGE = "exceeded D1's free tier daily row read limit";

export const hasMissingSqliteTableError = (error: unknown, tableName: string) => {
  const target = `${SQLITE_MISSING_TABLE_PREFIX} ${tableName}`;
  const visited = new Set<object>();
  let current: unknown = error;

  while (current) {
    if (current instanceof Error) {
      if (current.message.includes(target)) {
        return true;
      }

      const next = (current as Error & { cause?: unknown }).cause;
      if (!next || typeof next !== 'object') {
        current = next;
        continue;
      }

      if (visited.has(next)) {
        return false;
      }

      visited.add(next);
      current = next;
      continue;
    }

    if (String(current).includes(target)) {
      return true;
    }

    return false;
  }

  return false;
};

export const hasD1DailyRowReadLimitError = (error: unknown) => {
  const visited = new Set<object>();
  let current: unknown = error;

  while (current) {
    const message = current instanceof Error ? current.message : String(current);
    if (message.includes(D1_DAILY_ROW_READ_LIMIT_MESSAGE)) {
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
