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
  };
}

const PersonalTasksContext = createContext<PersonalTasksContextType | null>(null);

const LOCAL_STORAGE_KEY_PREFIX = 'rifqa_personal_tasks_';

export const PersonalTasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isDemoUser } = useAuth();
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

    if (isDemoUser) {
      // Demo mode: purely local
      setLoadingPersonalTasks(false);
      return;
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
  }, [currentUser?.uid, isDemoUser, loadLocalTasks, saveLocalTasks]);

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
    };

    if (isDemoUser) {
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
  };

  // Update personal task
  const updatePersonalTask = async (taskId: string, updates: Partial<PersonalTask>) => {
    if (!currentUser) return;

    const nowISO = new Date().toISOString();
    const finalUpdates = { ...updates, updatedAt: nowISO };

    if (isDemoUser) {
      const updated = personalTasks.map(t => t.id === taskId ? { ...t, ...finalUpdates } : t);
      setPersonalTasks(updated);
      saveLocalTasks(updated);
      return;
    }

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'personalTasks', taskId);
      await updateDoc(docRef, finalUpdates);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}/personalTasks/${taskId}`);
      const updated = personalTasks.map(t => t.id === taskId ? { ...t, ...finalUpdates } : t);
      setPersonalTasks(updated);
      saveLocalTasks(updated);
    }
  };

  // Delete personal task
  const deletePersonalTask = async (taskId: string) => {
    if (!currentUser) return;

    if (isDemoUser) {
      const updated = personalTasks.filter(t => t.id !== taskId);
      setPersonalTasks(updated);
      saveLocalTasks(updated);
      return;
    }

    try {
      const docRef = doc(db, 'users', currentUser.uid, 'personalTasks', taskId);
      await deleteDoc(docRef, );
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `users/${currentUser.uid}/personalTasks/${taskId}`);
      const updated = personalTasks.filter(t => t.id !== taskId);
      setPersonalTasks(updated);
      saveLocalTasks(updated);
    }
  };

  // Toggle Khatmah Unit (Juz 1..30)
  const togglePersonalUnit = async (taskId: string, unitNumber: number) => {
    const task = personalTasks.find(t => t.id === taskId);
    if (!task) return;

    const currentUnits = new Set(task.completedUnits || []);
    const isNowCompleted = !currentUnits.has(unitNumber);

    if (isNowCompleted) {
      currentUnits.add(unitNumber);
      // Confetti burst for accomplishing a Juz!
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#047857', '#10b981', '#fbbf24', '#f59e0b'],
      });
      if (task.reminderSoundEnabled ?? true) {
        playNotificationChime();
      }
    } else {
      currentUnits.delete(unitNumber);
    }

    const updatedUnits = Array.from(currentUnits).sort((a, b) => a - b);
    const allCompleted = updatedUnits.length === (task.totalUnits || 30);
    const todayStr = new Date().toISOString().split('T')[0];

    // If whole Khatmah finished
    if (allCompleted && !task.isCompleted) {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'],
      });
      showToast('مبارك! لقد ختمت القرآن الكريم في ختمتك الخاصة المباركة، تقبل الله منك ورزقك نوره وهداه 🌟📖', 'success');
    }

    const newHistory = [...(task.completionHistory || [])];
    if (isNowCompleted) {
      newHistory.push({
        date: todayStr,
        unitNumber,
        timestamp: new Date().toISOString(),
      });
    }

    await updatePersonalTask(taskId, {
      completedUnits: updatedUnits,
      currentCount: updatedUnits.length,
      isCompleted: allCompleted,
      completedAt: allCompleted ? new Date().toISOString() : undefined,
      lastCompletedDate: isNowCompleted ? todayStr : task.lastCompletedDate,
      completionHistory: newHistory.slice(-50), // keep recent 50 logs
    });
  };

  // Increment Dhikr counter
  const incrementDhikr = async (taskId: string, step = 1) => {
    const task = personalTasks.find(t => t.id === taskId);
    if (!task) return;

    // Haptic vibration feedback if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }

    const target = task.targetCount || 100;
    const newCount = (task.currentCount || 0) + step;
    const justReachedTarget = newCount >= target && (task.currentCount || 0) < target;

    if (justReachedTarget) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#f59e0b'],
      });
      playNotificationChime();
      showToast(`ما شاء الله! بلغت الهدف المبارك لـ "${task.title}" (${target}) تقبل الله طاعتك 📿✨`, 'success');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    await updatePersonalTask(taskId, {
      currentCount: newCount,
      isCompleted: newCount >= target,
      lastCompletedDate: todayStr,
      streakDays: justReachedTarget ? (task.streakDays || 0) + 1 : (task.streakDays || 0),
    });
  };

  // Reset Dhikr count
  const resetDhikr = async (taskId: string) => {
    await updatePersonalTask(taskId, {
      currentCount: 0,
      isCompleted: false,
    });
    showToast('تم تصفير عداد الورد للبدء من جديد', 'info');
  };

  // Mark task completed today (for wird/custom)
  const markCompletedToday = async (taskId: string, notes?: string) => {
    const task = personalTasks.find(t => t.id === taskId);
    if (!task) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const isAlreadyDoneToday = task.lastCompletedDate === todayStr;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#059669', '#34d399', '#f59e0b'],
    });
    if (task.reminderSoundEnabled ?? true) {
      playNotificationChime();
    }

    const newStreak = isAlreadyDoneToday ? (task.streakDays || 1) : ((task.streakDays || 0) + 1);

    const history = [...(task.completionHistory || [])];
    history.push({
      date: todayStr,
      notes: notes || undefined,
      timestamp: new Date().toISOString(),
    });

    await updatePersonalTask(taskId, {
      lastCompletedDate: todayStr,
      isCompleted: true,
      streakDays: newStreak,
      completionHistory: history.slice(-50),
    });

    showToast(`هنيئاً لك! أتممت "${task.title}" اليوم بنجاح 🌿 تقبل الله منك`, 'success');
  };

  // Test personal task reminder
  const testPersonalReminder = async (task: PersonalTask) => {
    const sound = task.reminderSoundEnabled ?? true;
    let detail = '';
    if (task.category === 'khatmah') {
      const doneCount = task.completedUnits?.length || 0;
      detail = `متبقٍ ${30 - doneCount} أجزاء لإتمام الختمة`;
    } else if (task.category === 'dhikr') {
      detail = `الهدف: ${task.targetCount || 100} ذكر`;
    } else if (task.targetTime) {
      detail = `الوقت المحدد: ${task.targetTime}`;
    }

    const sent = sendPersonalTaskReminderNotification({
      title: task.title,
      category: task.category,
      detail,
      playSound: sound,
    });

    if (sent) {
      showToast(`تم إرسال إشعار تذكير تجريبي لـ "${task.title}" بنجاح 🔔`, 'success');
    } else {
      if (sound) playNotificationChime();
      showToast(`تنبيه تجريبي لـ "${task.title}": حان وقت إنجاز برنامجك الخاص ✨ (يمكنك تفعيل إشعارات المتصفح للمزيد من التنبيهات)`, 'info');
    }
  };

  // Open & Close personal Quran reader
  const openPersonalQuranReader = useCallback((juzNumber: number, personalTaskId: string) => {
    const task = personalTasks.find(t => t.id === personalTaskId);
    const isCompleted = task?.completedUnits?.includes(juzNumber) || false;
    setActivePersonalReader({
      juzNumber,
      personalTaskId,
      isCompleted,
    });
  }, [personalTasks]);

  const closePersonalQuranReader = useCallback(() => {
    setActivePersonalReader(null);
  }, []);

  // Periodic reminder checker (checks every 30 seconds for scheduled times)
  useEffect(() => {
    const checkScheduledReminders = () => {
      if (personalTasks.length === 0) return;

      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentHHMM = `${currentHours}:${currentMinutes}`;
      const todayStr = now.toISOString().split('T')[0];

      personalTasks.forEach(task => {
        if (!task.reminderEnabled) return;
        const taskReminderTime = task.reminderTime || '06:00';

        if (taskReminderTime === currentHHMM) {
          const notifyKey = `${task.id}_${todayStr}_${taskReminderTime}`;
          if (!lastNotifiedMap[notifyKey]) {
            // Send reminder
            sendPersonalTaskReminderNotification({
              title: task.title,
              category: task.category,
              detail: task.category === 'khatmah' ? 'تذكير ورد التلاوة اليومي' : undefined,
              playSound: task.reminderSoundEnabled ?? true,
            });

            setLastNotifiedMap(prev => ({ ...prev, [notifyKey]: todayStr }));
            showToast(`تذكير خاص: حان موعد وردك الخاص "${task.title}" 🔔`, 'info');
          }
        }
      });
    };

    checkScheduledReminders();
    const interval = setInterval(checkScheduledReminders, 30000);
    return () => clearInterval(interval);
  }, [personalTasks, lastNotifiedMap, showToast]);

  // Calculated overall statistics
  const stats = useMemo(() => {
    const totalActive = personalTasks.filter(t => !t.isCompleted || t.frequency === 'daily').length;
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = personalTasks.filter(t => t.lastCompletedDate === todayStr).length;

    const khatmahTask = personalTasks.find(t => t.category === 'khatmah' && !t.isCompleted);
    const khatmahProgressPercent = khatmahTask
      ? Math.round(((khatmahTask.completedUnits?.length || 0) / (khatmahTask.totalUnits || 30)) * 100)
      : 0;

    const highestStreak = personalTasks.reduce((max, t) => Math.max(max, t.streakDays || 0), 0);

    return {
      totalActive,
      completedToday,
      khatmahProgressPercent,
      highestStreak,
    };
  }, [personalTasks]);

  return (
    <PersonalTasksContext.Provider
      value={{
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
      }}
    >
      {children}
    </PersonalTasksContext.Provider>
  );
};

export const usePersonalTasks = () => {
  const context = useContext(PersonalTasksContext);
  if (!context) {
    throw new Error('usePersonalTasks must be used within a PersonalTasksProvider');
  }
  return context;
};
