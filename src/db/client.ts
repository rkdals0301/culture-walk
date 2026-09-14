import { drizzle } from 'drizzle-orm/d1';

import * as schema from '@/db/schema';

type DrizzleD1Client = Parameters<typeof drizzle>[0];

export function getDb(db?: DrizzleD1Client) {
  if (!db) return null;

  return drizzle(db, { schema });
}
