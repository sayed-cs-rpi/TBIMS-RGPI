// Firebase Cloud Messaging Service Worker
// This file will be dynamically configured with environment variables at build time

self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw] Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw] Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Import Firebase SDK from CDN
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase with environment variables
// These will be replaced by the actual values during the build process
const firebaseConfig = {
  apiKey: '' || 'your_api_key',
  authDomain: '' || 'your_project.firebaseapp.com',
  projectId: '' || 'your_project_id',
  storageBucket: '' || 'your_project.appspot.com',
  messagingSenderId: '' || 'your_sender_id',
  appId: '' || 'your_app_id',
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw] Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'Support Ticket Update';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new update',
      icon: '/icon.svg',
      badge: '/icon-light-32x32.png',
      data: payload.data,
      tag: payload.data?.ticketId || 'ticket-notification',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw] Notification clicked:', event);
    
    event.notification.close();
    
    const ticketId = event.notification.data?.ticketId;
    const url = ticketId ? `/tickets/${ticketId}` : '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  });
} catch (error) {
  console.error('[firebase-messaging-sw] Firebase initialization error:', error);
}

