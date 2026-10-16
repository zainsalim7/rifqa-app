import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { PersonalTask, PersonalTaskCategory, PersonalTaskFrequency } from '../types';
import { sendPersonalTaskReminderNotification, playNotificationChime } from '../utils/reminderService';
import confetti from 'canvas-confetti';

interface CreatePersonalTaskInput {
  title: string;
  category: PersonalTaskCategory;
  description?: string;
  targetCount?: number;
  targetDate?: string;
  targetTime?: string;
  reminderEnabled: boolean;
  reminderTime?: string;
  reminderSoundEnabled?: boolean;
  frequency: PersonalTaskFrequency;
}

interface PersonalTasksContextType {
  personalTasks: PersonalTask[];
  loadingPersonalTasks: boolean;
  createPersonalTask: (input: CreatePersonalTaskInput) => Promise<PersonalTask>;
  updatePersonalTask: (taskId: string, updates: Partial<PersonalTask>) => Promise<void>;
  deletePersonalTask: (taskId: string) => Promise<void>;
  togglePersonalUnit: (taskId: string, unitNumber: number) => Promise<void>;
  incrementDhikr: (taskId: string, step?: number) => Promise<void>;
  resetDhikr: (taskId: string) => Promise<void>;
  markCompletedToday: (taskId: string, notes?: string) => Promise<void>;
  testPersonalReminder: (task: PersonalTask) => Promise<void>;
  activePersonalReader: { juzNumber: number; personalTaskId: string; isCompleted: boolean } | null;
  openPersonalQuranReader: (juzNumber: number, personalTaskId: string) => void;
  closePersonalQuranReader: () => void;
  stats: {
    totalActive: number;
    completedToday: number;
    khatmahProgressPercent: number;
    highestStreak: number;
}
}

const PersonalTasksContext = createContext<PersonalTasksContextType | null>(null);

const LOCAL_STORAGE_KEY_PREFIX = 'rifqa_personal_tasks_';

export const PersonalTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
  const [loadingPersonalTasks, setLoadingPersonalTasks] = useState(true);
  const [lastNotifiedMap, setLastNotifiedMap] = useState<Record<string, string>>({});

  // Active personal reader
  const [activePersonalReader, setActivePersonalReader] = useState<{
    juzNumber: number;
    personalTaskId: string;
    isCompleted: boolean;
  } | null>(null);

  const storageKey = currentUser ? `${LOCAL_STORAGE_KEY_PREFIX}${currentUser.uid}` : null;

  // Load from localStorage first as fallback / cache
  const loadLocalTasks = useCallback((): PersonalTask[] => {
    if (!storageKey) return [];
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error reading personal tasks from localStorage', e);
    }
    return [];
  }, [storageKey]);

  const saveLocalTasks = useCallback((tasks: PersonalTask[]) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch (e) {
      console.warn('Error saving personal tasks to localStorage', e);
    }
  }, [storageKey]);

  // Sync with Firestore (or LocalStorage for demo users)
  useEffect(() => {
    if (!currentUser) {
      setPersonalTasks([]);
      setLoadingPersonalTasks(false);
      return;
    }

    const cached = loadLocalTasks();
    if (cached.length > 0) {
      setPersonalTasks(cached);
    }

    // Firestore listener for real users
    const colRef = collection(db, 'users', currentUser.uid, 'personalTasks');
    const q = query(colRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasks: PersonalTask[] = [];
        snapshot.forEach((docSnap) => {
          tasks.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setPersonalTasks(tasks);
        saveLocalTasks(tasks);
        setLoadingPersonalTasks(false);
      },
      (error) => {
        console.warn('Firestore personal tasks subscription error, falling back to local', error);
        handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}/personalTasks`);
        setLoadingPersonalTasks(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser])

  // Create personal task
  const createPersonalTask = async (input: CreatePersonalTaskInput): Promise<PersonalTask> => {
    if (!currentUser) throw new Error('يرجى تسجيل الدخول لإنشاء برنامجك الخاص');

    const id = `pt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowISO = new Date().toISOString();

    const newTask: PersonalTask = {
      id,
      userId: currentUser.uid,
      title: input.title.trim(),
      category: input.category,
      description: input.description?.trim() || '',
      targetCount: input.category === 'khatmah' ? 30 : (input.targetCount || (input.category === 'dhikr' ? 100 : 1)),
      currentCount: 0,
      targetDate: input.targetDate || '',
      targetTime: input.targetTime || '',
      reminderEnabled: input.reminderEnabled,
      reminderTime: input.reminderTime || '06:00',
      reminderSoundEnabled: input.reminderSoundEnabled ?? true,
      frequency: input.frequency,
      completedUnits: input.category === 'khatmah' ? [] : undefined,
      totalUnits: input.category === 'khatmah' ? 30 : undefined,
      isCompleted: false,
      streakDays: 0,
      completionHistory: [],
      createdAt: nowISO,
      updatedAt: nowISO,
}

  const createPersonalTask = async (input: CreatePersonalTaskInput): Promise<PersonalTask> => {
      const updated = [newTask, ...personalTasks];
      setPersonalTasks(updated);
      saveLocalTasks(updated);
      return newTask;
    }

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'personalTasks', id);
      await setDoc(docRef, newTask);
      return newTask;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}/personalTasks/${id}`);
      // Optimistic fallback
      const updated = [newTask, ...personalTasks];
      setPersonalTasks(updated);
      saveLocalTasks(updated);
      return newTask;
    }
}

  // Update personal task
  const updatePersonalTask = async (taskId: string, updates: Partial<PersonalTask>) => {
    if (!currentUser) return;

    const nowISO = new Date().toISOString();
    const finalUpdates = { ...updates, updatedAt: nowISO };

      const updated = personalTasks.map(t => t.id === taskId ? { ...t, ...finalUpdates } : t);
      setPersonalTasks(updated);
      saveLocalTasks(updated);
      return;

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'personalTasks', taskId);
      await updateDoc(docRef, finalUpdates);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/personalTasks/${taskId}`);
      const updated = personalTasks.map(t => t.id === taskId ? { ...t, ...finalUpdates } : t);
      setPersonalTasks(updated);
      saveLocalTasks(updated);
    }
  }

  // Delete personal task
  const deletePersonalTask = async (taskId: string) => {
    if (!currentUser) return;

      const updated = personalTasks.filter(t => t.id !== taskId);
      setPersonalTasks(updated);
      saveLocalTasks(updated);
      return;

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'personalTasks', taskId);
      await deleteDoc(docRef);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/personalTasks/${taskId}`);
      const updated = personalTasks.filter(t => t.id !== taskId);
      setPersonalTasks(updated);
      saveLocalTasks(updated);
    }
  }

  // Toggle Khatmah Unit (Juz 1..30)
  const togglePersonalUnit = async (taskId: string, unitNumber: number) => {
    const task = personalTasks.find(t => t.id === taskId);
    if (!task) return;

    const currentUnits = new Set(task.completedUnits || []);
    const isNowCompleted = !currentUnits.has(unitNumber);

    if (isNowCompleted) {
      currentUnits.add(unitNumber);
      // Confetti burst for accomplishing a Juz!
      }
  }


  const value = {
    personalTasks,
    loadingPersonalTasks,
    createPersonalTask,
    updatePersonalTask,
    deletePersonalTask,
    togglePersonalUnit,
    incrementDhikr,
    resetDhikr,
    markCompletedToday,
    testPersonalReminder,
    activePersonalReader,
    openPersonalQuranReader,
    closePersonalQuranReader,
    stats,
  };

  return (
    <PersonalTasksContext.Provider value={value}>
      {children}
    </PersonalTasksContext.Provider>
  );
}

export const usePersonalTasks = () => {
  const context = useContext(PersonalTasksContext);
  if (!context) {
    throw new Error('usePersonalTasks must be used within a PersonalTasksProvider');
  }
  return context;
}
