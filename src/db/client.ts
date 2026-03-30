import { drizzle } from 'drizzle-orm/d1';

import * as schema from '@/db/schema';
import { getWorkerEnv } from '@/server/cloudflare';

export async function getDb() {
  const env = await getWorkerEnv();

  if (!env?.DB) {
    return null;
  }

  return drizzle(env.DB as any, { schema });
}
