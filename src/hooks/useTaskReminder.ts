import { useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { 
  sendTaskReminderNotification, 
  playNotificationChime 
} from '../utils/reminderService';
import { getNowInAdenISO } from '../utils/dateUtils';

export interface UncompletedTaskSummary {
  id: string;
  title: string;
  taskName: string;
  isOverdue: boolean;
}

export function useTaskReminder() {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const { assignments, tasks, pendingOverdueAssignments } = useGroup();
  const { showToast } = useToast();

  // Gather all uncompleted tasks assigned to the current user
  const uncompletedTasksList = useMemo(() => {
    if (!currentUser) return [];

    const list: UncompletedTaskSummary[] = [];

    // 1. Current cycle assignments
    Object.entries(assignments).forEach(([taskId, taskAssignments]) => {
      const parentTask = tasks.find(t => t.id === taskId);
      const taskName = parentTask?.name || 'مهمة جماعية';

      taskAssignments.forEach(assign => {
        if (
          assign.assignedToUserId === currentUser.uid &&
          assign.status !== 'completed' &&
          assign.status !== 'excused'
        ) {
          list.push({
            id: assign.id || `${taskId}_${assign.cycleNumber}_${assign.unitNumber}`,
            title: assign.unitTitle,
            taskName,
            isOverdue: false,
          });
        }
      });
    });

    // 2. Overdue assignments from past cycles
    pendingOverdueAssignments.forEach(ov => {
      if (
        ov.assignedToUserId === currentUser.uid &&
        ov.status !== 'completed' &&
        ov.status !== 'excused'
      ) {
        const parentTask = tasks.find(t => t.id === ov.taskId);
        list.push({
          id: `overdue_${ov.taskId}_${ov.cycleNumber}_${ov.unitNumber}`,
          title: `${ov.unitTitle} (معلق)`,
          taskName: parentTask?.name || 'ورد سابق',
          isOverdue: true,
        });
      }
    });

    return list;
  }, [currentUser?.uid, assignments, tasks, pendingOverdueAssignments]);

  // Trigger immediate test notification
  const triggerTestReminder = useCallback(async () => {
    const soundEnabled = userProfile?.reminderSoundEnabled ?? true;
    const taskTitles = uncompletedTasksList.map(t => `${t.title} (${t.taskName})`);

    const titlesForNotification = taskTitles.length > 0 
      ? taskTitles 
      : ['الجزء الخامس عشر (ختمة القرآن المباركة)', 'أذكار الصباح والمساء'];

    const count = uncompletedTasksList.length > 0 ? uncompletedTasksList.length : 2;

    const shown = sendTaskReminderNotification({
      uncompletedCount: count,
      taskTitles: titlesForNotification,
      playSound: soundEnabled,
    });

    if (shown) {
      showToast('تم إرسال إشعار التذكير التجريبي بنجاح 🔔', 'success');
    } else {
      // If browser permission is not granted, at least play chime and show in-app toast
      if (soundEnabled) {
        playNotificationChime();
      }
      showToast(
        uncompletedTasksList.length > 0
          ? `تنبيه تجريبي: لديك ${count} مهام غير مكتملة (${titlesForNotification.slice(0, 2).join('، ')})`
          : 'تنبيه تجريبي: جميع مهامك مكتملة حالياً، ما شاء الله!',
        'info'
      );
    }
  }, [uncompletedTasksList, userProfile, showToast]);

  // Periodic checker for daily reminder schedule
  useEffect(() => {
    if (!currentUser || !userProfile) return;

    const isEnabled = userProfile.dailyUncompletedReminderEnabled ?? userProfile.reminderEnabled ?? true;
    if (!isEnabled) return;

    const targetTime = userProfile.dailyUncompletedReminderTime || userProfile.reminderTime || '20:00';

    const checkInterval = setInterval(() => {
      // Get current time in Aden (HH:mm) and today's date (YYYY-MM-DD)
      const nowAden = getNowInAdenISO(); // e.g. "2026-10-11T17:30:00+03:00"
      const datePart = nowAden.substring(0, 10);
      const timePart = nowAden.substring(11, 16); // "HH:mm"

      // Check if time matches
      if (timePart === targetTime) {
        // Prevent multiple fires on the same day
        const localKey = `rifqa_reminder_sent_${currentUser.uid}_${datePart}`;
        const alreadySentLocally = localStorage.getItem(localKey);
        const alreadySentInProfile = userProfile.lastReminderSentDate?.startsWith(datePart);

        if (!alreadySentLocally && !alreadySentInProfile) {
          // Check if there are any uncompleted tasks
          if (uncompletedTasksList.length > 0) {
            localStorage.setItem(localKey, 'true');

            const taskTitles = uncompletedTasksList.map(t => `${t.title} (${t.taskName})`);
            const soundEnabled = userProfile.reminderSoundEnabled ?? true;

            sendTaskReminderNotification({
              uncompletedCount: uncompletedTasksList.length,
              taskTitles,
              playSound: soundEnabled,
            });

            showToast(
              `تذكير الأوراد اليومي: لديك ${uncompletedTasksList.length} مهام وأوراد لم تسجل إنجازها بعد اليوم.`,
              'info'
            );

            // Record in profile to synchronize across devices
            updateUserProfile({
              lastReminderSentDate: nowAden,
            }).catch(() => {});
          }
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkInterval);
  }, [currentUser?.uid, userProfile, uncompletedTasksList, showToast, updateUserProfile]);

  return {
    uncompletedTasksList,
    uncompletedCount: uncompletedTasksList.length,
    triggerTestReminder,
  };
}
