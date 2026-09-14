// Compatibility cleanup for browsers that registered the old network-only
// worker. New app versions no longer register a service worker. When an old
// registration checks this URL for updates, this worker activates and removes
// its own registration.
self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.registration.unregister());
});
