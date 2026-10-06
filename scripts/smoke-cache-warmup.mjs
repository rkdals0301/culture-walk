import { setTimeout as delay } from 'node:timers/promises';

export const requestUntilCacheHit = async (request, label, pathname, { maxAttempts = 5, wait = ms => delay(ms) } = {}) => {
  const attempts = [];
  for (let index = 1; index <= maxAttempts; index += 1) {
    const attempt = await request(`${label}-${index}`, pathname);
    attempts.push(attempt);
    if (!attempt?.result?.ok || attempt.result.cacheStatus === 'HIT') break;
    if (index < maxAttempts) await wait(100 * index);
  }
  return attempts;
};
