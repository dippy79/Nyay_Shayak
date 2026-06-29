/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

type ExtendedNotificationOptions = NotificationOptions & {
  vibrate?: number[];
  actions?: { action: string; title: string; icon?: string }[];
};

// Push notification received
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data: { title?: string; body?: string; url?: string } = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Legis Update', body: event.data.text() };
  }

  const options: ExtendedNotificationOptions = {
    body: data.body || 'Aapke case mein nayi update hai',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Dekhein' },
      { action: 'close', title: 'Band karein' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Legis — Kanuni Update',
      options
    )
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const url = (event.notification.data as { url?: string })?.url || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});