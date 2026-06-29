/**
 * Web Push Notifications service
 * Handles subscription, permission requests, and notification display
 */

type ExtendedNotificationOptions = NotificationOptions & {
  actions?: { action: string; title: string; icon?: string }[];
  vibrate?: number[];
};

export const requestPushPermission = async (userId: string): Promise<boolean> => {
  try {
    if (!('Notification' in window) ||!('serviceWorker' in navigator) ||!('PushManager' in window)) {
      console.warn('[Push] Not supported in this browser');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission!== 'granted') {
      console.log('[Push] Permission denied');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

    const subscribeOptions: PushSubscriptionOptionsInit = {
      userVisibleOnly: true,
     ...(vapidKey? { applicationServerKey: urlBase64ToUint8Array(vapidKey) } : {}),
    };

    const subscription = await registration.pushManager.subscribe(subscribeOptions);

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        user_id: userId,
      }),
    });

    if (!response.ok) throw new Error(`Server ${response.status}`);

    console.log('[Push] Subscription saved');
    localStorage.setItem('legis-pushSubscribed', 'true');
    return true;
  } catch (err) {
    console.error('[Push] Failed:', err);
    localStorage.removeItem('legis-pushSubscribed');
    return false;
  }
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const isPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

export const isPushSubscribed = (): boolean => {
  return localStorage.getItem('legis-pushSubscribed') === 'true';
};

export const showNotification = (title: string, options: ExtendedNotificationOptions = {}) => {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready
   .then((registration) => {
      return registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: 'legis-notification',
    
       ...options,
      }as NotificationOptions);
    })
   .catch((err) => console.error('[Push] showNotification failed:', err));
};

export const showCourtUpdateNotification = (cnr: string, nextHearing: string) => {
  showNotification('New Court Order', {
    body: `Case ${cnr}: Next hearing on ${nextHearing}`,
    tag: `court-update-${cnr}`,
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  });
};

export const showConsultationReminder = (lawyerName: string, time: string) => {
  showNotification('Consultation Reminder', {
    body: `Your consultation with ${lawyerName} is at ${time}`,
    tag: 'consultation-reminder',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'join', title: 'Join Call' },
      { action: 'reschedule', title: 'Reschedule' },
    ],
  });
};