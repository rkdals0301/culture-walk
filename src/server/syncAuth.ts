export type SyncAuthorizationResult = { authorized: true } | { authorized: false; status: 401 | 503; message: string };

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

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

  if (providedToken === expectedToken) return { authorized: true };
  return { authorized: false, status: 401, message: 'Unauthorized' };
};
