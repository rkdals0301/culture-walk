import {
  getClientErrorType,
  type ClientErrorScope,
  type ClientErrorSource,
} from '@/utils/clientErrorTelemetry';

export const reportClientError = (
  source: ClientErrorSource,
  scope: ClientErrorScope,
  error: unknown
) => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

  try {
    const body = JSON.stringify({
      source,
      scope,
      errorType: getClientErrorType(error),
      pathname: window.location.pathname.slice(0, 256),
    });

    if (navigator.sendBeacon?.('/api/client-errors', new Blob([body], { type: 'application/json' }))) {
      return;
    }

    void fetch('/api/client-errors', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Error reporting must never interfere with page rendering or recovery.
  }
};
