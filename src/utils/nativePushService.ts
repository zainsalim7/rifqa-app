import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export interface NativePushStatus {
  isNative: boolean;
  platform: 'android' | 'ios' | 'web';
  token: string | null;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
}

/**
 * Checks if the current environment is running inside Capacitor Native (Android APK or iOS)
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get current platform ('android' | 'ios' | 'web')
 */
export function getCurrentPlatform(): 'android' | 'ios' | 'web' {
  const plat = Capacitor.getPlatform();
  if (plat === 'android') return 'android';
  if (plat === 'ios') return 'ios';
  return 'web';
}

/**
 * Register native push notifications for Android & iOS
 */
export async function initNativePushNotifications(
  userId?: string,
  onTokenReceived?: (token: string) => void,
  onNotificationReceived?: (notification: PushNotificationSchema) => void,
  onAction?: (action: ActionPerformed) => void
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!Capacitor.isNativePlatform()) {
    return { success: false, error: 'Not running in native mobile container' };
  }

  try {
    // 1. Check permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      return { success: false, error: 'تم رفض إذن الإشعارات من إعدادات الهاتف.' };
    }

    // 2. Add listeners before registering
    await PushNotifications.removeAllListeners();

    return new Promise((resolve) => {
      // Token registration listener
      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('[Native Push] Registration token:', token.value);
        try {
          localStorage.setItem('rifqa_native_push_token', token.value);
        } catch {}

        if (userId) {
          await saveNativeTokenToFirestore(userId, token.value);
        }

        if (onTokenReceived) {
          onTokenReceived(token.value);
        }

        resolve({ success: true, token: token.value });
      });

      // Error listener
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('[Native Push] Registration error:', error);
        resolve({
          success: false,
          error: error?.error || error?.message || 'فشل تسجيل رمز الإشعارات من نظام التشغيل'
        });
      });

      // Push received while app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('[Native Push] Received in foreground:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      });

      // Notification action / tap
      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('[Native Push] Action performed:', action);
        if (onAction) {
          onAction(action);
        }
      });

      // 3. Register with Google / Apple push services
      PushNotifications.register().catch((err) => {
        console.error('[Native Push] Register call error:', err);
        resolve({ success: false, error: err?.message || 'خطأ أثناء تسجيل الجهاز' });
      });
    });
  } catch (err: any) {
    console.error('[Native Push] Initialization failed:', err);
    return { success: false, error: err?.message || 'خطأ غير متوقع في خدمة الإشعارات الأصلية' };
  }
}

/**
 * Save Native Device Token in Firestore
 */
export async function saveNativeTokenToFirestore(userId: string, token: string): Promise<boolean> {
  if (!userId || !token) return false;
  try {
    const platform = getCurrentPlatform();
    const tokenDocRef = doc(db, `users/${userId}/fcmTokens/${token.slice(-30)}`);
    await setDoc(
      tokenDocRef,
      {
        token,
        userId,
        platform, // 'android' or 'ios'
        device: 'native-mobile',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    const userDocRef = doc(db, `users/${userId}`);
    await setDoc(
      userDocRef,
      {
        nativePushToken: token,
        nativePlatform: platform,
        fcmEnabled: true,
        fcmUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return true;
  } catch (err) {
    console.warn('[Native Push] Failed to save token to Firestore:', err);
    return false;
  }
}
