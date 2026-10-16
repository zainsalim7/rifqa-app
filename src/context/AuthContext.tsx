import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as fbSignOut, 
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { getNowInAdenISO } from '../utils/dateUtils';

interface AuthContextType {
  currentUser: { uid: string; displayName: string; email?: string; photoURL?: string } | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<{ uid: string; displayName: string; email?: string; photoURL?: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const userObj = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'مشارك',
          email: fbUser.email || undefined,
          photoURL: fbUser.photoURL || undefined,
        };
        setCurrentUser(userObj);
        await loadOrCreateUserProfile(fbUser.uid, userObj.displayName, userObj.email, userObj.photoURL);
      } else {
        setCurrentUser(null);
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

  const signOut = async () => {
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
      signInWithGoogle,
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
