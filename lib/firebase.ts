import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Check if Firebase is configured
export const isFirebaseConfigured = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

let app: ReturnType<typeof initializeApp> | null = null;
export let auth: ReturnType<typeof getAuth> | null = null;
export let db: ReturnType<typeof getFirestore> | null = null;
export let storage: ReturnType<typeof getStorage> | null = null;

try {
  if (isFirebaseConfigured) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
} catch (error) {
  console.error('[v0] Firebase initialization error:', error);
}

// Helper to get non-null auth/db (throws if not configured)
export function getAuthInstance() {
  if (!auth || !db) {
    throw new Error('Firebase is not configured. Please set up your environment variables.');
  }
  return auth;
}

export function getDbInstance() {
  if (!db) {
    throw new Error('Firebase is not configured. Please set up your environment variables.');
  }
  return db;
}

export function getStorageInstance() {
  if (!storage) {
    throw new Error('Firebase Storage is not configured. Please set up your environment variables.');
  }
  return storage;
}

// Initialize messaging if in browser
let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && app) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log('[v0] Messaging not available:', error);
  }
}
export { messaging };

export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (!messaging || !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
    // Still request permission so local Notification API works without VAPID.
    try {
      await Notification.requestPermission();
    } catch {
      /* ignore */
    }
    return null;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: registration,
      });
      return token;
    }
  } catch (error) {
    console.error('[v0] Error getting notification token:', error);
  }
  return null;
}
