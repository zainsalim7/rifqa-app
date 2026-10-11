/**
 * Service for managing daily reminders, notification triggers, and acoustic chimes for uncompleted group tasks.
 */

// Play a peaceful, soothing synthesizer chime using Web Audio API
export const playNotificationChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First bell tone (gentle harmonic tone - E5 ~659Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.95);

    // Second bell tone (peaceful resolution - A5 ~880Hz, delayed by 180ms)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.18);
    gain2.gain.setValueAtTime(0.001, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.23);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 1.65);
  } catch (err) {
    console.debug('Audio chime playback omitted or unsupported:', err);
  }
};

/**
 * Format 24-hour time "HH:mm" to Arabic friendly representation: e.g. "08:30 مساءً"
 */
export const formatTimeArabic = (timeStr?: string): string => {
  if (!timeStr || !timeStr.includes(':')) return 'لم يُحدد';
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';

  if (isNaN(hours)) return timeStr;

  const period = hours >= 12 ? 'مساءً' : 'صباحاً';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;

  const paddedHours = hours.toString().padStart(2, '0');
  return `${paddedHours}:${minutes} ${period}`;
};

/**
 * Calculates remaining hours and minutes until the next reminder time
 */
export const getTimeUntilNextReminder = (targetTimeStr: string): string => {
  if (!targetTimeStr || !targetTimeStr.includes(':')) return '';

  const [tHour, tMin] = targetTimeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(tHour, tMin, 0, 0);

  // If time has already passed today, next occurrence is tomorrow
  let diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) {
    diffMs += 24 * 60 * 60 * 1000;
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours === 0 && diffMinutes === 0) {
    return 'حان موعد التذكير الآن';
  } else if (diffHours === 0) {
    return `متبقٍ ${diffMinutes} دقيقة`;
  } else if (diffMinutes === 0) {
    return `متبقٍ ${diffHours} ساعة`;
  } else {
    return `متبقٍ ${diffHours} ساعة و${diffMinutes} دقيقة`;
  }
};

export interface TaskReminderPayload {
  uncompletedCount: number;
  taskTitles: string[];
  playSound?: boolean;
}

/**
 * Trigger system notification and chime if permissions are met
 */
export const sendTaskReminderNotification = (payload: TaskReminderPayload): boolean => {
  const { uncompletedCount, taskTitles, playSound = true } = payload;

  if (playSound) {
    playNotificationChime();
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const title = 'رفقة الإنجاز 🌿 تذكير بمهامك اليومية';
    const previewList = taskTitles.slice(0, 3).join(' • ');
    const moreSuffix = taskTitles.length > 3 ? ` و ${taskTitles.length - 3} أخرى` : '';
    
    const body = uncompletedCount === 1
      ? `لديك مهمة واحدة لم تسجل إنجازها بعد: "${previewList}". تذكير لطيف لتدوم البركة ✨`
      : `لديك ${uncompletedCount} مهام وأوراد جماعية لم تسجل إنجازها بعد اليوم: (${previewList}${moreSuffix}). بارك الله في وقتك 🌿`;

    const notif = new Notification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'rifqa-daily-reminder',
      requireInteraction: false,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (e) {
    console.warn('Notification instantiation error:', e);
    return false;
  }
};

export interface PersonalTaskReminderPayload {
  title: string;
  category: string;
  detail?: string;
  playSound?: boolean;
}

/**
 * Trigger system notification specifically for private personal tasks/wirds
 */
export const sendPersonalTaskReminderNotification = (payload: PersonalTaskReminderPayload): boolean => {
  const { title, category, detail, playSound = true } = payload;

  if (playSound) {
    playNotificationChime();
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const categoryLabel = 
      category === 'khatmah' ? '📖 تذكير ختمتك القرآنية الخاصة' :
      category === 'dhikr' ? '📿 تذكير ورد الذكر والتسبيح' :
      category === 'wird' ? '🌿 تذكير بوردك اليومي الخاص' :
      '🔒 تذكير بمهمتك الخاصة';

    const body = detail
      ? `${title} — ${detail}. حان وقت إنجاز برنامجك الخاص ✨`
      : `حان موعد إنجاز: "${title}". بارك الله في أوقاتك وأعمالك 🌿`;

    const notif = new Notification(categoryLabel, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `personal-reminder-${Date.now()}`,
      requireInteraction: false,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (e) {
    console.warn('Notification instantiation error:', e);
    return false;
  }
};
