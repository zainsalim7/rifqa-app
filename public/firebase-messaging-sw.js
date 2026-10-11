// Firebase Cloud Messaging Service Worker for background notifications
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDVzjx_PX2Vo5CPAEst_9QUFbFZWESAn8c",
  authDomain: "tahdeer-activation.firebaseapp.com",
  projectId: "tahdeer-activation",
  storageBucket: "tahdeer-activation.firebasestorage.app",
  messagingSenderId: "347511201457",
  appId: "1:347511201457:web:4f7632bc5bcd936be00c90"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'رفقة الإنجاز 🌿';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'تذكير بمهامك وأورادك اليومية.',
    icon: payload.notification?.icon || '/icon.svg',
    badge: '/icon.svg',
    dir: 'rtl',
    lang: 'ar',
    data: payload.data || {},
    vibrate: [200, 100, 200]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Generic push event listener fallback (for custom Web Push payloads)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    if (data.notification) {
      // Handled by Firebase SDK or fallback
      const title = data.notification.title || 'رفقة الإنجاز 🌿';
      const options = {
        body: data.notification.body || 'تذكير جديد بمهامك وأورادك.',
        icon: data.notification.icon || '/icon.svg',
        badge: '/icon.svg',
        dir: 'rtl',
        lang: 'ar',
        data: data.data || {},
        vibrate: [200, 100, 200]
      };
      event.waitUntil(self.registration.showNotification(title, options));
    }
  } catch (err) {
    // Non-JSON push payload
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('رفقة الإنجاز 🌿', {
        body: text,
        icon: '/icon.svg',
        dir: 'rtl'
      })
    );
  }
});

// Handle notification click to bring app into focus
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
