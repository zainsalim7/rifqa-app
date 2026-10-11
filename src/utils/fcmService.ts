import { isSupported, getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from '../firebase';

const VAPID_KEY_STORAGE = 'rifqa_fcm_vapid_key';
const TOKEN_STORAGE = 'rifqa_fcm_token';

/**
 * Check if Firebase Cloud Messaging & Service Workers are supported in the current browser
 */
export async function checkFCMSupport(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
    return false;
  }
  try {
    return await isSupported();
  } catch (err) {
    console.warn('FCM support check failed:', err);
    return false;
  }
}

/**
 * Register or get the background Service Worker
 */
export async function registerFCMServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    console.log('[FCM] Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (err) {
    console.error('[FCM] Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Get cached VAPID Key from localStorage
 */
export function getStoredVapidKey(): string {
  try {
    return localStorage.getItem(VAPID_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

/**
 * Store VAPID Key in localStorage
 */
export function setStoredVapidKey(key: string): void {
  try {
    localStorage.setItem(VAPID_KEY_STORAGE, key.trim());
  } catch {
    // ignore
  }
}

/**
 * Get cached FCM token from localStorage
 */
export function getStoredFCMToken(): string {
  try {
    return localStorage.getItem(TOKEN_STORAGE) || '';
  } catch {
    return '';
  }
}

/**
 * Request Notification Permission and generate FCM Token
 */
export async function requestFCMToken(customVapidKey?: string): Promise<{ token: string | null; error?: string }> {
  const supported = await checkFCMSupport();
  if (!supported) {
    return { token: null, error: 'المتصفح الحالي لا يدعم إشعارات الويب أو أن الاتصال ليس آمناً (HTTPS مطلوب).' };
  }

  // Request browser notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { token: null, error: 'تم رفض إذن الإشعارات من قِبل المستخدم في المتصفح.' };
  }

  // Ensure Service Worker is registered
  const swReg = await registerFCMServiceWorker();
  if (!swReg) {
    return { token: null, error: 'تعذر تسجيل ملف الـ Service Worker (/firebase-messaging-sw.js).' };
  }

  const vapidKeyToUse = (customVapidKey || getStoredVapidKey()).trim();

  try {
    const messaging: Messaging = getMessaging(app);
    const tokenOptions: { serviceWorkerRegistration: ServiceWorkerRegistration; vapidKey?: string } = {
      serviceWorkerRegistration: swReg
    };

    if (vapidKeyToUse) {
      tokenOptions.vapidKey = vapidKeyToUse;
    }

    const token = await getToken(messaging, tokenOptions);

    if (token) {
      try {
        localStorage.setItem(TOKEN_STORAGE, token);
        if (vapidKeyToUse) {
          setStoredVapidKey(vapidKeyToUse);
        }
      } catch {}
      return { token };
    } else {
      return { token: null, error: 'لم يتمكن Firebase من توليد رمز الجهاز. تحقق من صحة مفتاح VAPID Key.' };
    }
  } catch (err: any) {
    console.error('[FCM] Error obtaining token:', err);
    return {
      token: null,
      error: err?.message || 'حدث خطأ غير متوقع أثناء طلب رمز FCM من خوادم Google.'
    };
  }
}

/**
 * Persist FCM Token in Firestore for targeted push notifications
 */
export async function saveFCMTokenToFirestore(userId: string, token: string): Promise<boolean> {
  if (!userId || !token) return false;
  try {
    const tokenDocRef = doc(db, `users/${userId}/fcmTokens/${token.slice(-30)}`);
    await setDoc(tokenDocRef, {
      token,
      userId,
      platform: 'web',
      userAgent: navigator.userAgent,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });

    // Also update directly on user profile
    const userDocRef = doc(db, `users/${userId}`);
    await setDoc(userDocRef, {
      lastFcmToken: token,
      fcmEnabled: true,
      fcmUpdatedAt: serverTimestamp()
    }, { merge: true });

    return true;
  } catch (err) {
    console.warn('[FCM] Failed to save token to Firestore:', err);
    return false;
  }
}

/**
 * Send a test Push Notification directly through the registered Service Worker
 */
export async function triggerLocalSWNotification(title: string, body: string): Promise<boolean> {
  try {
    const swReg = await navigator.serviceWorker.ready;
    if (swReg && swReg.showNotification) {
      await swReg.showNotification(title, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        dir: 'rtl',
        lang: 'ar',
        tag: `test-fcm-${Date.now()}`,
        vibrate: [200, 100, 200]
      } as any);
      return true;
    }
  } catch (err) {
    console.warn('SW test notification failed:', err);
  }

  // Fallback to standard Notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon.svg' });
    return true;
  }

  return false;
}

/**
 * Setup foreground listener for messages arriving while the app is actively open
 */
export async function listenToForegroundMessages(callback: (payload: any) => void): Promise<(() => void) | null> {
  const supported = await checkFCMSupport();
  if (!supported) return null;

  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload);
      callback(payload);
    });
  } catch (err) {
    console.warn('[FCM] Foreground listener setup error:', err);
    return null;
  }
}
