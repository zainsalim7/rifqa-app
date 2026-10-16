import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { UserBadge } from '../types';
import { formatDateInAden, formatDateTimeInAden } from '../utils/dateUtils';
import { useTaskReminder } from '../hooks/useTaskReminder';
import { 
  formatTimeArabic, 
  getTimeUntilNextReminder, 
  playNotificationChime 
} from '../utils/reminderService';
import { 
  User, 
  Bell, 
  BellRing, 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Heart,
  Save,
  Volume2,
  VolumeX,
  Send,
  AlertCircle,
  Check,
  Sun,
  Moon,
  UserPlus,
  Users,
  Github
} from 'lucide-react';

const PRESET_TIMES = [
  { label: 'بعد الفجر', time: '06:00', icon: '🌅' },
  { label: 'بعد الظهر', time: '13:30', icon: '☀️' },
  { label: 'بعد العصر', time: '16:30', icon: '⛅' },
  { label: 'بعد المغرب', time: '18:30', icon: '🌇' },
  { label: 'بعد العشاء', time: '20:30', icon: '🌙' },
  { label: 'قبل النوم', time: '22:00', icon: '💤' },
];

interface ProfileViewProps {
}

  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const { assignments, tasks, myDependents } = useGroup();
  const { showToast } = useToast();
  const { uncompletedTasksList, uncompletedCount, triggerTestReminder } = useTaskReminder();

  const [reminderEnabled, setReminderEnabled] = useState(
    userProfile?.dailyUncompletedReminderEnabled ?? userProfile?.reminderEnabled ?? true
  );
  const [reminderTime, setReminderTime] = useState(
    userProfile?.dailyUncompletedReminderTime || userProfile?.reminderTime || '20:00'
  );
  const [soundEnabled, setSoundEnabled] = useState(
    userProfile?.reminderSoundEnabled ?? true
  );
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [savingSettings, setSavingSettings] = useState(false);
  const [badges, setBadges] = useState<UserBadge[]>([]);

  // Sync state if userProfile changes
  useEffect(() => {
    if (userProfile) {
      if (userProfile.dailyUncompletedReminderEnabled !== undefined) {
        setReminderEnabled(userProfile.dailyUncompletedReminderEnabled);
      } else if (userProfile.reminderEnabled !== undefined) {
        setReminderEnabled(userProfile.reminderEnabled);
      }

      if (userProfile.dailyUncompletedReminderTime) {
        setReminderTime(userProfile.dailyUncompletedReminderTime);
      } else if (userProfile.reminderTime) {
        setReminderTime(userProfile.reminderTime);
      }

      if (userProfile.reminderSoundEnabled !== undefined) {
        setSoundEnabled(userProfile.reminderSoundEnabled);
      }
    }
  }, [userProfile]);

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Fetch earned badges from Firestore
  useEffect(() => {
    if (!currentUser) return;
    const badgesRef = collection(db, `users/${currentUser.uid}/badges`);
    const unsub = onSnapshot(badgesRef, (snap) => {
      const list: UserBadge[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as UserBadge));
      setBadges(list);
    }, () => {});
    return () => unsub();
  }, [currentUser?.uid]);

  const requestNotification = async () => {
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === 'granted') {
          if (soundEnabled) playNotificationChime();
          new Notification('رفقة الإنجاز 🌿', {
            body: 'تم تفعيل التنبيهات بنجاح! سنذكرك يومياً بالأوراد والمهام التي لم تكتمل بعد.',
            icon: '/icon.svg'
          });
          showToast('تم تفعيل إشعارات الجهاز بنجاح!', 'success');
        } else if (perm === 'denied') {
          showToast('تم رفض إذن الإشعارات من المتصفح. يمكنك تفعيله من إعدادات موقعك.', 'error');
        }
      } catch (e) {
        showToast('تعذر طلب إذن الإشعارات.', 'error');
      }
    } else {
      showToast('المتصفح لا يدعم إشعارات النظام مباشرة.', 'info');
    }
  };

  const handleSavePreferences = async () => {
    setSavingSettings(true);
    try {
      await updateUserProfile({
        dailyUncompletedReminderEnabled: reminderEnabled,
        dailyUncompletedReminderTime: reminderTime,
        reminderEnabled: reminderEnabled,
        reminderTime: reminderTime,
        reminderSoundEnabled: soundEnabled,
      });
      showToast('تم حفظ إعدادات التذكير اليومي بنجاح 🌿', 'success');
    } catch {
      showToast('حدث خطأ أثناء حفظ التفضيلات', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Find all tasks completed by me
  const allMyCompletedUnits = Object.values(assignments)
    .flat()
    .filter(a => a.assignedToUserId === currentUser?.uid && a.status === 'completed');

  // Predefined badge catalog to show locked vs earned
  const BADGE_CATALOG = [
    { badgeId: 'daily_wird', title: 'أتممت ورد اليوم', desc: 'أتممت مهمتك اليومية بنجاح.', icon: '🌟' },
    { badgeId: 'khatmah_part', title: 'حامي الختمة', desc: 'شاركت في إتمام جزء من الختمة المباركة.', icon: '📖' },
    { badgeId: 'group_contrib', title: 'شاركت في إنجاز جماعي', desc: 'ساهمت في تقدم هدف المجموعة المشترك.', icon: '🤝' },
    { badgeId: 'team_spirit', title: 'روح التعاون', desc: 'وافقت على تبديل المهام لمساعدة رفيقك.', icon: '💚' },
    { badgeId: 'week_streak', title: 'أكملت أسبوعًا', desc: 'المداومة على الأوراد 7 أيام متتالية.', icon: '🕊️' },
  ];

  return (
    <div className="space-y-6 pb-20">
      
      {/* Profile Card Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-800 text-white flex items-center justify-center text-2xl font-bold shadow-inner">
            {currentUser?.displayName?.charAt(0) || 'م'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">{currentUser?.displayName}</h2>
            <p className="text-xs text-stone-500">{currentUser?.email || 'مشارك في رفقة الإنجاز'}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
              {allMyCompletedUnits.length} وحدة منجزة في المجموعات
            </span>
          </div>
        </div>
      </div>

      {/* Reminder & Notifications Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">
                إعدادات التذكير اليومي بالمهام غير المكتملة
              </h3>
              <p className="text-[11px] text-stone-500">
                تلقي إشعار دوري بأوراد ومهام المجموعة التي لم تنجزها بعد
              </p>
            </div>
          </div>
          <span className="text-[11px] text-stone-400 font-medium">توقيت عدن (Asia/Aden)</span>
        </div>

        <div className="space-y-4">
          {/* Main Toggle Switch */}
          <label className="flex items-start justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200/80 cursor-pointer hover:bg-stone-100/60 transition">
            <div className="space-y-1 pr-1">
              <span className="text-xs font-bold text-stone-900 block">
                تفعيل الإشعار التذكيري اليومي بمهام المجموعة المتبقية
              </span>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                يقوم التطبيق بتنبيهك تلقائياً في الوقت المحدد إذا كان لديك أوراد أو مهام جماعية لم تسجل إتمامها بعد.
              </p>
            </div>
            <input
              type="checkbox"
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
              className="mt-1 rounded text-emerald-700 focus:ring-emerald-600 w-5 h-5 cursor-pointer accent-emerald-700"
            />
          </label>

          {reminderEnabled && (
            <div className="space-y-4 pt-1 animate-fadeIn">
              {/* Daily Reminder Time Picker Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-800" />
                    <div>
                      <span className="text-xs font-bold text-stone-900 block">
                        وقت التذكير اليومي المحدد:
                      </span>
                      <span className="text-[11px] text-emerald-800 font-semibold">
                        {formatTimeArabic(reminderTime)} • {getTimeUntilNextReminder(reminderTime)}
                      </span>
                    </div>
                  </div>

                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="text-xs font-bold p-2.5 rounded-xl border border-emerald-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                {/* Quick Presets */}
                <div className="pt-2 border-t border-emerald-200/60">
                  <span className="text-[11px] text-stone-600 block mb-2 font-semibold">
                    أوقات مقترحة شائعة:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {PRESET_TIMES.map((preset) => {
                      const isSelected = reminderTime === preset.time;
                      return (
                        <button
                          key={preset.time}
                          type="button"
                          onClick={() => setReminderTime(preset.time)}
                          className={`p-2 rounded-xl text-[11px] font-semibold border transition flex flex-col items-center gap-0.5 ${
                            isSelected
                              ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                              : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <span className="text-sm">{preset.icon}</span>
                          <span className="font-bold">{preset.label}</span>
                          <span className="text-[10px] opacity-80">{preset.time}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sound / Chime Toggle */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-stone-400" />
                  )
                  }
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">نغمة التنبيه الصوتية:</span>
                    <span className="text-[11px] text-stone-500">
                      تشغيل نغمة هادئة ومريحة عند موعد التذكير
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => playNotificationChime()}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-stone-200/70 hover:bg-stone-300 text-stone-700 font-semibold transition"
                    title="استماع للنغمة"
                  >
                    استماع 🔊
                  </button>
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={(e) => setSoundEnabled(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600 w-4 h-4 cursor-pointer accent-emerald-700"
                  />
                </div>
              </div>

              {/* Browser Push Permission Card */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">إشعارات المتصفح والهاتف:</span>
                  <span className="text-[11px] text-stone-500">
                    الحالة الحالية:{' '}
                    {notificationPermission === 'granted' ? (
                      <span className="text-emerald-700 font-bold">مفعلة على جهازك ✅</span>
                    ) : notificationPermission === 'denied' ? (
                      <span className="text-rose-600 font-bold">محظورة في إعدادات المتصفح ❌</span>
                    ) : (
                      <span className="text-amber-700 font-bold">تحتاج إلى إذن ⚠️</span>
                    )
                    }
                  </span>
                </div>

                {notificationPermission !== 'granted' && (
                  <button
                    type="button"
                    onClick={requestNotification}
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap self-start sm:self-center"
                  >
                    تفعيل إشعارات الجهاز
                  </button>
                )
                }
              </div>

              {/* FCM External Push Card */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-bold text-[10px]">
                      FCM Push
                    </span>
                    <strong className="text-xs font-bold text-stone-900">
                      إشعارات الدفع الخارجية (Firebase Cloud Messaging)
                    </strong>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    استقبال التنبيهات والأوراد على الهاتف والكمبيوتر حتى عندما يكون التطبيق مقفلاً بالكامل.
                  </p>
                </div>


              {/* Native Mobile App (APK / iOS / GitHub) Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-amber-300 font-bold text-[10px] border border-emerald-400/30">
                  <p className="text-[11px] text-emerald-100/80">
                    بناء ملف APK حقيقي مع إشعارات FCM الخارجية، وتصدير المشروع بالكامل إلى مستودعك على GitHub مع بناء آلي.
                  </p>
                  </span>
                </div>

              {/* Current Uncompleted Tasks Live Status Widget */}
              <div className={`p-4 rounded-2xl border ${
                uncompletedCount > 0 
                  ? 'bg-amber-50/70 border-amber-200' 
                  : 'bg-emerald-50/60 border-emerald-200'
              } space-y-2.5`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {uncompletedCount > 0 ? (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    )
                    }
                    <span className="text-xs font-bold text-stone-900">
                      حالة مهامك وأورادك الحالية:
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    uncompletedCount > 0 
                      ? 'bg-amber-200 text-amber-900' 
                      : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {uncompletedCount > 0 ? `${uncompletedCount} مهام متبقية` : 'جميع المهام مكتملة'}
                  </span>
                </div>

                {uncompletedCount > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      هذه المهام هي التي سيتم تذكيرك بها عند حلول الساعة {formatTimeArabic(reminderTime)}:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {uncompletedTasksList.slice(0, 5).map((t) => (
                        <span
                          key={t.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-amber-200 text-stone-800 text-[11px] font-bold font-amiri shadow-2xs"
                        >
                          <span>{t.title}</span>
                          <span className="text-[9px] text-stone-400 font-sans">({t.taskName})</span>
                        </span>
                      ))}
                      {uncompletedTasksList.length > 5 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-xl bg-amber-100 text-amber-900 text-[10px] font-bold">
                          +{uncompletedTasksList.length - 5} أخرى
                        </span>
                      )
                      }
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    ما شاء الله تبارك الله! جميع أورادك ومهامك مكتملة حالياً، ولن يتم إرسال إشعارات حتى تُعيّن لك مهام جديدة في الدورة.
                  </p>
                )
                }

                {/* Test Notification Button */}
                <div className="pt-2 border-t border-stone-200/50 flex items-center justify-between">
                  <span className="text-[10px] text-stone-500">
                    يمكنك تجربة شكل وصوت الإشعار للتأكد من وصوله لهاتفك أو حاسوبك:
                  </span>
                  <button
                    type="button"
                    onClick={triggerTestReminder}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                  >
                    <Send className="w-3 h-3 text-amber-400" />
                    <span>تجربة الإشعار الآن</span>
                  </button>
                </div>
              </div>
            </div>
          )

          {/* Save Button */}
          <div className="pt-3 flex justify-end border-t border-stone-100">
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={savingSettings}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{savingSettings ? 'جارٍ الحفظ...' : 'حفظ إعدادات التذكير'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dependents & Children Section (الأبناء والتابعون التابعون لحسابك) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center text-xl shadow-2xs">
              👦
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span>الأبناء والتابعون المسجلون بحسابك (بدون هاتف)</span>
                {myDependents.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-bold border border-blue-200">
                    {myDependents.length} تابع
                  </span>
                )
                }
              </h3>
              <p className="text-xs text-stone-500">
                تكليف ابنك أو أفراد عائلتك بأوراد ومتابعة إنجازهم معك وإبلاغ المجموعة.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-stone-50 border border-dashed border-stone-200 text-center space-y-2.5">
            <p className="text-xs text-stone-600 leading-relaxed max-w-md mx-auto">
              إذا كان معك ولدك أو أحد أفراد عائلتك ليس لديه جوال وتريده أن يكون مكلفاً معكم بجزء من المهام أو الختمة تماماً مثلك وتكون مهمته في حسابك وتبلغ المجموعة بإنجازه؛ يمكنك إضافته هنا بضغطة واحدة!
            </p>

            <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 leading-relaxed">
              💡 <strong>كيف تتابع إنجازه؟</strong> تظهر مهام وأوراد ابنك مباشرة في صفحتك الرئيسية، ويمكنك فتح المصحف لقراءة ورده معه، وعند الضغط على «أتمّ {myDependents[0]?.displayName || 'ابنك'}» سيتم نشر الإنجاز في نشاط المجموعة فوراً مع التهنئة!
            </p>
          </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-stone-900">الأوسمة التشجيعية</h3>
          </div>
          <span className="text-xs text-stone-500">
            {badges.length} وسام مكتسب
          </span>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          أوسمة رمزية لتشجيع الاستمرار على الطاعة والمشاركة في الختمات، تُمنح تلقائياً عند تسجيل الإنجاز الفعلي.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {BADGE_CATALOG.map(item => {
            const earned = badges.find(b => b.badgeId === item.badgeId);

            return (
              <div
                key={item.badgeId}
                className={`p-4 rounded-2xl border transition flex items-start gap-3 ${
                  earned
                    ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                    : 'bg-stone-50 border-stone-200 opacity-60'
                }`}
              >
                <div className="text-2xl shrink-0 p-1">
                  {item.icon}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-stone-900">{item.title}</h4>
                    {earned && (
                      <span className="text-[10px] text-amber-700 font-bold">✨ مكتسب</span>
                    )
                    }
                  </div>
                  <p className="text-[11px] text-stone-600 leading-normal">{item.desc}</p>
                  {earned && (
                    <span className="text-[10px] text-stone-400 block pt-1">
                      حصلت عليه: {formatDateInAden(earned.awardedAt)}
                    </span>
                  )
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Completions Log */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-800" />
          <span>سجل إنجازاتي المسجلة مؤخراً:</span>
        </h3>

        {allMyCompletedUnits.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-500">
            لم تسجل إنجاز أي وحدات بعد في هذه الدورة.
          </div>
        ) : (
          <div className="space-y-2">
            {allMyCompletedUnits.map(unit => (
              <div
                key={unit.id}
                className="p-3 bg-stone-50 rounded-2xl border border-stone-100 flex items-center justify-between text-xs"
              >
                <span className="font-bold text-stone-800 font-amiri">{unit.unitTitle}</span>
                <span className="text-[10px] text-stone-500">
                  {unit.completedAt ? formatDateTimeInAden(unit.completedAt) : 'مكتمل'}
                </span>
              </div>
            ))}
          </div>
        )
        }
      </div>
      )

    </div>
  );
};
