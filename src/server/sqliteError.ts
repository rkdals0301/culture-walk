const SQLITE_MISSING_TABLE_PREFIX = 'no such table:';

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
