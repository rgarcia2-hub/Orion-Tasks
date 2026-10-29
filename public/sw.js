// Service Worker for Orion Push & Desktop Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push messages
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: 'Orion Workspace',
      body: event.data ? event.data.text() : 'Tienes un nuevo aviso en Orion',
    };
  }

  const title = data.title || 'Orion Workspace';
  const options = {
    body: data.body || 'Nuevo recordatorio o evento programado.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: data.tag || `orion-${Date.now()}`,
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click: focus app window or open it
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
