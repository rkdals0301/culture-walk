export type SyncAuthorizationResult = { authorized: true } | { authorized: false; status: 401 | 503; message: string };

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const MAX_TOKEN_BYTES = 256;
const TOKEN_ENCODER = new TextEncoder();

const hasMatchingToken = (expectedToken: string, providedToken: string | null | undefined) => {
  if (providedToken === null || providedToken === undefined) return false;

  const expectedBytes = TOKEN_ENCODER.encode(expectedToken);
  const providedBytes = TOKEN_ENCODER.encode(providedToken);
  if (expectedBytes.length > MAX_TOKEN_BYTES || providedBytes.length > MAX_TOKEN_BYTES) return false;

  let difference = expectedBytes.length ^ providedBytes.length;
  for (let index = 0; index < MAX_TOKEN_BYTES; index += 1) {
    difference |= (expectedBytes[index] ?? 0) ^ (providedBytes[index] ?? 0);
  }

  return difference === 0;
};

export const isLoopbackHostname = (hostname: string) => LOOPBACK_HOSTNAMES.has(hostname.toLowerCase());

export const authorizeSyncRequest = (options: {
  expectedToken?: string;
  providedToken?: string | null;
  hostname: string;
  production: boolean;
}): SyncAuthorizationResult => {
  const { expectedToken, providedToken, hostname, production } = options;

  if (!expectedToken) {
    if (!production && isLoopbackHostname(hostname)) return { authorized: true };
    return {
      authorized: false,
      status: 503,
      message: 'SYNC_TOKEN is required outside loopback development requests',
    };
  }

  if (hasMatchingToken(expectedToken, providedToken)) return { authorized: true };
  return { authorized: false, status: 401, message: 'Unauthorized' };
};
