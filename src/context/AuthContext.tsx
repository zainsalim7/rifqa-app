import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  User as FirebaseUser,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { getNowInAdenISO } from '../utils/dateUtils';

export interface DemoUserOption {
  uid: string;
  displayName: string;
  email: string;
  avatar: string;
  roleHint: string;
}

export const PRESET_DEMO_USERS: DemoUserOption[] = [
  { uid: 'demo_admin_zain', displayName: 'زين (المشرف)', email: 'zain@rifqa.app', avatar: '👨‍💼', roleHint: 'مدير المجموعة' },
  { uid: 'demo_member_omar', displayName: 'عمر اليماني', email: 'omar@rifqa.app', avatar: '👳', roleHint: 'عضو مشارك' },
  { uid: 'demo_member_fatima', displayName: 'فاطمة الزهراء', email: 'fatima@rifqa.app', avatar: '🧕', roleHint: 'عضوة مشاركة' },
  { uid: 'demo_member_khalid', displayName: 'خالد بن الوليد', email: 'khalid@rifqa.app', avatar: '🧔', roleHint: 'عضو مشارك' },
  { uid: 'demo_member_mariam', displayName: 'مريم العدني', email: 'mariam@rifqa.app', avatar: '👩', roleHint: 'عضوة مشاركة' },
];

interface AuthContextType {
  currentUser: { uid: string; displayName: string; email?: string; photoURL?: string } | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isDemoUser: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoUser: (demoUser: DemoUserOption) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<{ uid: string; displayName: string; email?: string; photoURL?: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);

  useEffect(() => {
    // Check if demo user was previously selected in localStorage
    const savedDemoUid = localStorage.getItem('rifqa_demo_user_uid');
    if (savedDemoUid) {
      const found = PRESET_DEMO_USERS.find(u => u.uid === savedDemoUid);
      if (found) {
        setIsDemoUser(true);
        setCurrentUser({
          uid: found.uid,
          displayName: found.displayName,
          email: found.email,
        });
        loadOrCreateUserProfile(found.uid, found.displayName, found.email);
        setLoading(false);
        return;
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        setIsDemoUser(false);
        const userObj = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'مشارك',
          email: fbUser.email || undefined,
          photoURL: fbUser.photoURL || undefined,
        };
        setCurrentUser(userObj);
        await loadOrCreateUserProfile(fbUser.uid, userObj.displayName, userObj.email, userObj.photoURL);
      } else {
        // Default to initial companion user so user can create groups and test immediately
        const defaultUser = PRESET_DEMO_USERS[0];
        setIsDemoUser(true);
        setCurrentUser({
          uid: defaultUser.uid,
          displayName: defaultUser.displayName,
          email: defaultUser.email,
        });
        loadOrCreateUserProfile(defaultUser.uid, defaultUser.displayName, defaultUser.email);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function loadOrCreateUserProfile(uid: string, displayName: string, email?: string, photoURL?: string) {
    const userRef = doc(db, 'users', uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid,
          displayName,
          email: email || '',
          photoURL: photoURL || '',
          reminderEnabled: true,
          reminderTime: '18:00',
          dailyUncompletedReminderEnabled: true,
          dailyUncompletedReminderTime: '20:00',
          reminderSoundEnabled: true,
          createdAt: getNowInAdenISO(),
        };
        try {
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile);
        } catch {
          // Fallback in memory
          setUserProfile(newProfile);
        }
      }
    } catch (e) {
      console.warn("Could not fetch user profile from Firestore:", e);
      const fallbackProfile: UserProfile = {
        uid,
        displayName,
        email: email || '',
        photoURL: photoURL || '',
        reminderEnabled: true,
        reminderTime: '18:00',
        dailyUncompletedReminderEnabled: true,
        dailyUncompletedReminderTime: '20:00',
        reminderSoundEnabled: true,
        createdAt: getNowInAdenISO(),
      };
      setUserProfile(fallbackProfile);
    }
  }

  const signInWithGoogle = async () => {
    try {
      localStorage.removeItem('rifqa_demo_user_uid');
      setIsDemoUser(false);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        await loadOrCreateUserProfile(
          res.user.uid,
          res.user.displayName || 'مشارك',
          res.user.email || undefined,
          res.user.photoURL || undefined
        );
      }
    } catch (error) {
      console.error("Google sign in error", error);
      throw error;
    }
  };

  const signInAsDemoUser = async (demoUser: DemoUserOption) => {
    // If not signed in to Firebase, sign in anonymously so Firestore security rules pass
    try {
      if (!auth.currentUser) {
        await signInAnonymously(auth).catch(() => {});
      }
    } catch {}

    localStorage.setItem('rifqa_demo_user_uid', demoUser.uid);
    setIsDemoUser(true);
    setCurrentUser({
      uid: demoUser.uid,
      displayName: demoUser.displayName,
      email: demoUser.email,
    });
    await loadOrCreateUserProfile(demoUser.uid, demoUser.displayName, demoUser.email);
  };

  const signOut = async () => {
    localStorage.removeItem('rifqa_demo_user_uid');
    setIsDemoUser(false);
    setCurrentUser(null);
    setUserProfile(null);
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.error("Sign out error", e);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = {
      ...(userProfile || {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        createdAt: getNowInAdenISO()
      }),
      ...data,
      updatedAt: getNowInAdenISO()
    };
    setUserProfile(updated as UserProfile);

    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, updated, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      isDemoUser,
      signInWithGoogle,
      signInAsDemoUser,
      signOut,
      updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
