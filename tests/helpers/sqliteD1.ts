import type { D1Binding, D1Statement } from '@/server/runtimeTypes';

import { readFile } from 'node:fs/promises';
import type { SQLInputValue } from 'node:sqlite';

// CI uses Node 22. Import lazily so older Node runtimes can skip
// the SQLite integration tests while continuing to run the other unit tests.
export const sqliteTestOptions = {
  skip: Number(process.versions.node.split('.')[0]) < 22 && 'SQLite integration tests require Node.js 22',
};

export const createSqliteD1 = async () => {
  const { DatabaseSync } = await import('node:sqlite');
  const database = new DatabaseSync(':memory:');
  database.exec(await readFile(new URL('../../db/schema.sql', import.meta.url), 'utf8'));

  const statement = (query: string, values: unknown[] = []): D1Statement => {
    const bindings = Array.from(new Set(query.match(/\?\d+/g) ?? []));
    const execute = (method: 'run' | 'all') => {
      const prepared = database.prepare(query);
      if (!bindings.length) return prepared[method](...values as SQLInputValue[]);
      const namedValues = Object.fromEntries(bindings.map(key => [key, values[Number(key.slice(1)) - 1] as SQLInputValue]));
      return prepared[method](namedValues);
    };
    return {
      bind: (...nextValues) => statement(query, nextValues),
      run: async () => execute('run'),
      all: async () => ({ results: execute('all') as Array<Record<string, unknown>> }),
    };
  };
  const d1: D1Binding = {
    prepare: query => statement(query),
    batch: async statements => {
      database.exec('BEGIN');
      try {
        const results = [];
        for (const query of statements) results.push(await query.run());
        database.exec('COMMIT');
        return results;
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };

  return { database, d1 };
};
