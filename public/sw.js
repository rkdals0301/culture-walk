const SERVICE_WORKER_VERSION = 'culture-walk-pwa-v1';

self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  // Culture data must always come from the current D1-backed API. Do not cache
  // it in the service worker, otherwise an installed app could show stale events.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  // Keep the worker intentionally network-only for now. Registration and
  // installability work without making the event/map UI silently stale offline.
  void SERVICE_WORKER_VERSION;
});
