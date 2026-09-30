import { reportClientError } from '@/client/reportClientError';

window.addEventListener('error', event => {
  if (!(event instanceof ErrorEvent)) return;

  try {
    reportClientError('window_error', 'global', event.error);
  } catch {
    // Instrumentation must not prevent hydration or other global handlers.
  }
});

window.addEventListener('unhandledrejection', event => {
  try {
    reportClientError('unhandled_rejection', 'global', event.reason);
  } catch {
    // Instrumentation must not prevent hydration or other global handlers.
  }
});
