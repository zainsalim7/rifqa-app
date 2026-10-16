import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { Task, TaskAssignment, RecurrenceType } from '../types';
import { formatDateInAden, formatDateTimeInAden } from '../utils/dateUtils';
import { getHijriDate } from '../utils/hijriCalendar';
import { isQuranTask, QURAN_30_JUZ } from '../utils/quranData';
import { getReadingBookmark, getLatestActiveBookmark } from '../utils/quranService';
import { QuranReaderModal } from './QuranReaderModal';
import { MultiJuzAssignmentModal } from './MultiJuzAssignmentModal';
import { 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  Layers, 
  RotateCcw, 
  ArrowRightLeft, 
  AlertCircle, 
  Plus, 
  Sparkles,
  Calendar,
  Flame,
  ChevronLeft,
  Users,
  Compass,
  Heart,
  Lock
} from 'lucide-react';
import { usePersonalTasks } from '../context/PersonalTasksContext';

interface HomeViewProps {
  onOpenTaskDetail: (task: Task) => void;
  onOpenCreateTask: () => void;
  onOpenCreateGroup: () => void;
  onOpenJoinGroup: () => void;
  onNavigateToPersonal?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenTaskDetail,
  onOpenCreateTask,
  onOpenCreateGroup,
  onOpenJoinGroup,
  onNavigateToPersonal,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const {
    personalTasks,
    incrementDhikr,
    markCompletedToday,
    openPersonalQuranReader,
    stats: personalStats
  } = usePersonalTasks();
  const { 
    currentGroup, 
    members,
    tasks, 
    cycles, 
    assignments, 
    pendingOverdueAssignments,
    myDependents,
    isMyDependent,
    isCurrentUserAdmin,
    markUnitCompleted, 
    markPendingUnitCompleted,
    undoUnitCompleted,
    excuseUnit,
    incrementSharedTarget,
    requestSwap,
    openQuranReader
  } = useGroup();

  const [selectedBrowseJuz, setSelectedBrowseJuz] = useState<number>(1);
  const [recurrenceFilter, setRecurrenceFilter] = useState<'all' | RecurrenceType>('all');
  const [excuseDialogTarget, setExcuseDialogTarget] = useState<{ taskId: string; cycleNumber: number; unitNumber: number } | null>(null);
  const [excuseReason, setExcuseReason] = useState('');
  const [customCounterInput, setCustomCounterInput] = useState<{ [taskId: string]: number }>({});
  const [completingUnitId, setCompletingUnitId] = useState<number | null>(null);
  const [readingJuz, setReadingJuz] = useState<{
    juzNumber: number;
    taskId: string;
    cycleNumber: number;
    unitNumber: number;
    isCompleted: boolean;
  } | null>(null);
  const [multiJuzTask, setMultiJuzTask] = useState<Task | null>(null);

  const myDependentUserIds = React.useMemo(() => {
    return new Set(myDependents.map(d => d.userId));
  }, [myDependents]);

  const myDependentAssignments = React.useMemo(() => {
    return Object.entries(assignments).flatMap(([taskId, taskAssignments]) => {
      const parentTask = tasks.find(t => t.id === taskId);
      return taskAssignments
        .filter(a => myDependentUserIds.has(a.assignedToUserId) || (a.parentUserId === currentUser?.uid && a.assignedToUserId !== currentUser?.uid))
        .map(a => ({
          ...a,
          taskName: parentTask?.name || 'مهمة جماعية',
          parentTask,
        }));
    });
  }, [assignments, myDependentUserIds, tasks, currentUser?.uid]);

  const filteredTasks = tasks.filter(t => {
    if (recurrenceFilter === 'all') return true;
    return t.recurrence === recurrenceFilter;
  });

  const handleMarkComplete = async (taskId: string, cycleNumber: number, unitNumber: number) => {
    try {
      setCompletingUnitId(unitNumber);
      await markUnitCompleted(taskId, cycleNumber, unitNumber);
      showToast('تقبل الله منك! تم تسجيل إتمام الورد بنجاح ✨', 'success');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء حفظ الإتمام', 'error');
    } finally {
      setCompletingUnitId(null);
    }
  };

  const handleConfirmExcuse = async () => {
    if (!excuseDialogTarget) return;
    try {
      await excuseUnit(
        excuseDialogTarget.taskId,
        excuseDialogTarget.cycleNumber,
        excuseDialogTarget.unitNumber,
        excuseReason || 'اعتذار لظرف طارئ'
      );
      showToast('تم تسجيل العذر بلطف، يسّر الله أمرك.', 'info');
      setExcuseDialogTarget(null);
      setExcuseReason('');
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ', 'error');
    }
  };

  if (!currentGroup) {
    return (
      <div className="py-10 px-4 max-w-xl mx-auto text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-3xl shadow-sm text-emerald-800">
          🌿
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stone-900">مرحباً بك في رفقة الإنجاز</h2>
          <p className="text-stone-600 text-sm leading-relaxed max-w-md mx-auto">
            منصتك المباركة لتشارك أوراد القرآن، الأذكار، والمهام الدورية مع أحبابك ورفاقك بدون إحراج وبمتابعة جماعية هادئة.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={onOpenCreateGroup}
            className="p-4 rounded-2xl bg-emerald-800 text-white font-bold hover:bg-emerald-700 transition flex flex-col items-center gap-2 shadow"
          >
            <Plus className="w-6 h-6 text-amber-300" />
            <span>إنشاء مجموعة جديدة</span>
            <span className="text-xs font-normal text-emerald-200">كن مشرفاً وادعُ رفاقك</span>
          </button>

          <button
            onClick={onOpenJoinGroup}
            className="p-4 rounded-2xl bg-white border border-stone-200 text-stone-800 font-bold hover:bg-stone-50 transition flex flex-col items-center gap-2 shadow-sm"
          >
            <Users className="w-6 h-6 text-emerald-700" />
            <span>الانضمام برمز دعوة</span>
            <span className="text-xs font-normal text-stone-500">أدخل رمز الدعوة من رفيقك</span>
          </button>
        </div>

        <div className="pt-4 border-t border-stone-200">
          </button>
          <p className="text-[11px] text-stone-500 mt-2">
            تنشئ مجموعة كاملة جاهزة بها ختمة قرآن ومهام نموذجية للتجربة المباشرة.
          </p>

          {/* Quick link to private personal program */}
          {onNavigateToPersonal && (
            <div className="mt-4 pt-4 border-t border-stone-200">
              <button
                onClick={onNavigateToPersonal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs transition shadow-sm"
              >
                <Lock className="w-4 h-4" />
                <span>أو ابدأ برنامجك وختمتك الخاصة الفردية (سرّي دون مجموعة) 🔒</span>
              </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* Group Header Card */}
      <div className="bg-gradient-to-l from-emerald-900 to-emerald-800 text-white rounded-3xl p-5 md:p-6 shadow-md border border-emerald-700/60 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-700/80 text-[11px] font-semibold text-emerald-200 border border-emerald-600/50">
                {currentGroup.isDemo ? 'مجموعة تجريبية' : 'مجموعة نشطة'}
              </span>
              <span className="text-xs text-amber-200 font-semibold font-amiri bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-600/30">
              </span>
              <span className="text-xs text-emerald-300">
              </span>
            </div>
            {isCurrentUserAdmin && (
              <button
                onClick={onOpenCreateTask}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs font-bold transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة مهمة</span>
              </button>
          </div>

          <div>
            <h2 className="text-xl md:text-2xl font-bold text-emerald-50">{currentGroup.name}</h2>
            {currentGroup.description && (
              <p className="text-emerald-200/90 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
                {currentGroup.description}
              </p>
          </div>

          {/* Quick Group Stat Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-700/60 text-center">
            <div className="bg-emerald-950/40 rounded-xl p-2">
              <span className="text-[11px] text-emerald-300 block">المهام الفعالة</span>
              <span className="text-lg font-bold text-amber-300">{tasks.length}</span>
            </div>
            <div className="bg-emerald-950/40 rounded-xl p-2">
              <span className="text-[11px] text-emerald-300 block">دورة الشهر</span>
              <span className="text-lg font-bold text-emerald-100">
                {tasks.find(t => t.unitTemplate === 'quran_30_juz') ? `الدورة ${tasks.find(t => t.unitTemplate === 'quran_30_juz')?.currentCycleNumber || 1}` : 'نشطة'}
              </span>
            </div>
            <div className="bg-emerald-950/40 rounded-xl p-2">
              <span className="text-[11px] text-emerald-300 block">إنجازك اليوم</span>
              <span className="text-lg font-bold text-emerald-200">
                {Object.values(assignments).flat().filter(a => a.assignedToUserId === currentUser?.uid && a.status === 'completed').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Private Program Banner / Widget */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-emerald-950 text-white rounded-3xl p-4 md:p-5 shadow-sm border border-stone-700/60 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm md:text-base text-stone-100 flex items-center gap-1.5">
                  <span>برنامجي الخاص وأورادي السرية</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-sans">
                    خاص بك 🔒
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-stone-300">
                {personalTasks.length > 0
                  ? `لديك ${personalTasks.length} برامج خاصة • تم إنجاز ${personalStats.completedToday} اليوم • لا تطلع عليها المجموعة`
                  : 'حدد لنفسك ختمة خاصة أو أوراداً يومية بتوقيت وتنبيهات سرية دون علم المجموعة'}
              </p>
            </div>
          </div>

          {onNavigateToPersonal && (
            <button
              onClick={onNavigateToPersonal}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold transition flex items-center gap-1 shadow-sm shrink-0"
            >
              <span>{personalTasks.length > 0 ? 'فتح ومتابعة الأوراد' : 'بدء برنامج خاص'}</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
        </div>

        {/* Quick Preview of Active Personal Items if any */}
        {personalTasks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-stone-800">
            {personalTasks.slice(0, 3).map(pt => {
              const todayDate = new Date().toISOString().split('T')[0];
              const isDoneToday = pt.lastCompletedDate === todayDate || pt.isCompleted;

              return (
                <div key={pt.id} className="bg-stone-800/80 rounded-2xl p-2.5 border border-stone-700 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-stone-200 block truncate">{pt.title}</span>
                    <span className="text-[10px] text-stone-400">
                      {pt.category === 'khatmah' ? `أُنجز ${pt.completedUnits?.length || 0} من 30 جزء` :
                       pt.category === 'dhikr' ? `العدد: ${pt.currentCount || 0} / ${pt.targetCount || 100}` :
                    </span>
                  </div>

                  {pt.category === 'khatmah' ? (
                    <button
                      onClick={() => {
                        let nextJuz = 1;
                        for (let i = 1; i <= 30; i++) {
                          if (!pt.completedUnits?.includes(i)) {
                            nextJuz = i;
                            break;
                          }
                        }
                        openPersonalQuranReader(nextJuz, pt.id);
                      }}
                      className="px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1"
                      title="قراءة في المصحف"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>اقرأ</span>
                    </button>
                  ) : pt.category === 'dhikr' ? (
                    <button
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg text-[11px] font-bold shrink-0"
                    >
                      +10 📿
                    </button>
                  ) : (
                    <button
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 ${
                        isDoneToday ? 'bg-emerald-600/30 text-emerald-300' : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {isDoneToday ? 'أُنجز ✓' : 'إتمام'}
                    </button>
                </div>
              );
          </div>
      </div>

      {/* Pending Overdue Wards from Previous Cycles ("معلق في الذمة حتى ينجزه") */}
      {pendingOverdueAssignments.filter(a => a.assignedToUserId === currentUser?.uid).length > 0 && (
        <div className="bg-amber-50/90 border border-amber-300 rounded-3xl p-4 md:p-5 shadow-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-950 font-amiri flex items-center gap-2">
                <span>أوراد معلقة سابقة لم تكتمل (في الذمة)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-sans font-bold">
                  {pendingOverdueAssignments.filter(a => a.assignedToUserId === currentUser?.uid).length} معلق
                </span>
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                انتهت الدورة السابقة وما زال هذا الورد معلقاً عليك. يمكنك قراءته الآن أو تأكيد إتمامه لتبرأ ذمتك وتكتمل الختمة المباركة.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {pendingOverdueAssignments
              .filter(a => a.assignedToUserId === currentUser?.uid)
              .map(ov => (
                <div key={`${ov.taskId}_${ov.cycleNumber}_${ov.unitNumber}`} className="p-3.5 bg-white rounded-2xl border border-amber-200 shadow-2xs flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-stone-900 font-amiri">
                        {ov.unitTitle}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                        الدورة {ov.cycleNumber} (معلق)
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 block mt-1">
                      مطلوب قضاؤه وإتمامه
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-stone-100">
                    <button
                      onClick={() => setReadingJuz({
                        juzNumber: ov.unitNumber,
                        taskId: ov.taskId,
                        cycleNumber: ov.cycleNumber,
                        unitNumber: ov.unitNumber,
                        isCompleted: false,
                      className="flex-1 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>قراءة الجزء المعلق</span>
                    </button>

                    <button
                      onClick={async () => {
                        await markPendingUnitCompleted(ov.taskId, ov.cycleNumber, ov.unitNumber);
                        showToast('هنيئاً لك! تم قضاء وإنجاز الورد المعلق بنجاح ✨', 'success');
                      }}
                      className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                      <span>أتممت وقضيت</span>
                    </button>
                  </div>
                </div>
          </div>
        </div>

      {/* Hero Quran Khatmah & Ward Card (بطاقة الورد القرآني المباشرة والمصحف الشريف) */}
      {(() => {
        const primaryQuranTask = tasks.find(t => isQuranTask(t));
        const myQuranUnits = primaryQuranTask
          ? (assignments[primaryQuranTask.id] || []).filter(a => a.assignedToUserId === currentUser?.uid)
          : [];
        const latestActiveBookmark = getLatestActiveBookmark();

        return (
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-3xl p-5 md:p-6 shadow-md border border-emerald-600/70 space-y-4 relative overflow-hidden">
            {/* Islamic subtle background badge */}
            <div className="absolute top-2 left-3 text-7xl font-amiri text-white/5 pointer-events-none select-none">
              ﷽
            </div>

            <div className="flex items-center justify-between gap-3 relative z-10 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center shrink-0 shadow-sm border border-amber-300">
                  <BookOpen className="w-5 h-5 text-emerald-950" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold font-amiri text-amber-200 flex items-center gap-2">
                    <span>الورد القرآني والمصحف الشريف</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-700/80 text-emerald-100 font-sans font-semibold border border-emerald-500/40">
                      رسم عثماني موثق
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-200">
                    {primaryQuranTask 
                      ? `${primaryQuranTask.name} - الدورة ${primaryQuranTask.currentCycleNumber || 1}` 
                      : 'قراءة وتدبر أجزاء القرآن الكريم مع التمرير التلقائي وحفظ موضع القراءة'}
                  </p>
                </div>
              </div>

              {latestActiveBookmark && (
                <button
                  onClick={() => openQuranReader({
                    juzNumber: latestActiveBookmark.unitNumber,
                    taskId: latestActiveBookmark.taskId || 'general_quran',
                    cycleNumber: latestActiveBookmark.cycleNumber || 1,
                    unitNumber: latestActiveBookmark.unitNumber,
                    isCompleted: false,
                  className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 border border-amber-400/40 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                  title="استئناف القراءة من حيث توقفت"
                >
                  <span>📌 متابعة من صفحة {latestActiveBookmark.pageNumber || '—'} (سورة {latestActiveBookmark.surahName})</span>
                </button>
            </div>

            {/* If user has assigned Quran units in this cycle */}
            {myQuranUnits.length > 0 ? (
              <div className="space-y-3 relative z-10">
                <div className="text-xs font-semibold text-emerald-200">
                  وردك المخصص في هذه الدورة ({myQuranUnits.length} جزء):
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myQuranUnits.map(unit => {
                    const info = QURAN_30_JUZ.find(j => j.juzNumber === unit.unitNumber);
                    const isDone = unit.status === 'completed';
                    const isExcused = unit.status === 'excused';
                    const unitBookmark = primaryQuranTask 
                      ? getReadingBookmark(primaryQuranTask.id, primaryQuranTask.currentCycleNumber || 1, unit.unitNumber)
                      : null;

                    return (
                      <div
                        key={unit.id}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3.5 ${
                          isDone 
                            ? 'bg-emerald-950/60 border-emerald-600/70' 
                            : 'bg-white/10 border-emerald-500/40 backdrop-blur-xs'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-base font-bold font-amiri text-amber-100">
                              {unit.unitTitle}
                            </span>
                            {isDone ? (
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500 text-stone-950 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-stone-950" />
                                أُنجز الورد
                              </span>
                            ) : isExcused ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-bold">
                                معتذر
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30 font-semibold">
                                قيد القراءة
                              </span>
                          </div>

                          {info && (
                            <p className="text-xs text-emerald-200/90 leading-relaxed font-amiri">
                              {info.description}
                            </p>

                          {unitBookmark && (
                            <span className="text-[11px] text-amber-300 block font-medium">
                              📌 آخر موضع: صفحة {unitBookmark.pageNumber || '—'} - سورة {unitBookmark.surahName} (الآية {unitBookmark.lastAyahNumber})
                            </span>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-emerald-700/60 flex-wrap">
                          <button
                            onClick={() => openQuranReader({
                              juzNumber: unit.unitNumber,
                              taskId: primaryQuranTask!.id,
                              cycleNumber: primaryQuranTask!.currentCycleNumber || 1,
                              unitNumber: unit.unitNumber,
                              isCompleted: isDone,
                            className="flex-1 py-2.5 px-4 bg-gradient-to-l from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-stone-950 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
                            title="فتح نص الجزء بالرسم العثماني مع التمرير التلقائي"
                          >
                            <BookOpen className="w-4 h-4 text-emerald-950" />
                            <span>📖 قراءة الجزء ({unit.unitNumber})</span>
                          </button>

                          {isDone ? (
                            <button
                              className="py-2 px-3 bg-emerald-950/70 hover:bg-emerald-950 text-emerald-300 rounded-xl text-xs font-semibold transition flex items-center gap-1 border border-emerald-700/50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>تراجع</span>
                            </button>
                          ) : (
                            <button
                              disabled={completingUnitId === unit.unitNumber}
                              className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs border border-emerald-500/50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                              <span>أتممت</span>
                            </button>
                        </div>
                      </div>
                    );
                </div>

                {/* Quick picker to browse any other Juz */}
                <div className="flex items-center gap-2 pt-2 border-t border-emerald-700/60 text-xs flex-wrap">
                  <span className="text-emerald-300">أو تصفح أي جزء آخر من الـ 30 جزءاً:</span>
                  <select
                    value={selectedBrowseJuz}
                    className="py-1 px-2 rounded-lg bg-emerald-950 text-emerald-100 border border-emerald-600 text-xs font-semibold focus:outline-none"
                  >
                    {QURAN_30_JUZ.map(j => (
                      <option key={j.juzNumber} value={j.juzNumber}>
                        الجزء {j.juzNumber}: {j.title}
                      </option>
                  </select>
                  <button
                    onClick={() => openQuranReader({
                      juzNumber: selectedBrowseJuz,
                      taskId: primaryQuranTask!.id,
                      cycleNumber: primaryQuranTask!.currentCycleNumber || 1,
                      unitNumber: selectedBrowseJuz,
                      isCompleted: false,
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-bold transition"
                  >
                    📖 قراءة الجزء {selectedBrowseJuz}
                  </button>
                </div>
              </div>
            ) : (
              /* If user has no specific assigned Juz in this cycle */
              <div className="space-y-3 relative z-10 p-4 bg-emerald-950/50 rounded-2xl border border-emerald-700/60">
                <p className="text-xs text-emerald-200 leading-relaxed">
                  المصحف الشريف مفتوح لك دائماً بالرسم العثماني الموثق مع خاصية التمرير التلقائي للأعلى وسرعات متعددة تناسب قراءتك وحفظ موضع القراءة:
                </p>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                    <span className="text-xs text-emerald-300 shrink-0 font-medium">اختر الجزء:</span>
                    <select
                      value={selectedBrowseJuz}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-900 text-amber-200 border border-emerald-600 text-xs font-bold focus:outline-none"
                    >
                      {QURAN_30_JUZ.map(j => (
                        <option key={j.juzNumber} value={j.juzNumber}>
                          الجزء {j.juzNumber}: {j.title} ({j.description})
                        </option>
                    </select>
                  </div>

                  <button
                    onClick={() => openQuranReader({
                      juzNumber: selectedBrowseJuz,
                      taskId: primaryQuranTask ? primaryQuranTask.id : 'general_quran',
                      cycleNumber: primaryQuranTask?.currentCycleNumber || 1,
                      unitNumber: selectedBrowseJuz,
                      isCompleted: false,
                    className="py-2.5 px-5 bg-gradient-to-l from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-stone-950 font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-2 transition active:scale-95"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-950" />
                    <span>📖 فتح وقراءة الجزء ({selectedBrowseJuz})</span>
                  </button>
                </div>
              </div>
          </div>
        );

      {/* Dependents & Children Section (أوراد ومهام الأبناء والتابعين تحت إشرافك) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center text-xl shadow-2xs">
              👦
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-amiri flex items-center gap-2">
                <span>أوراد ومهام الأبناء والتابعين (تحت إشرافك)</span>
                {myDependents.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-sans font-bold border border-blue-200">
                    {myDependents.length} تابع
                  </span>
              </h3>
              <p className="text-xs text-stone-500">
                متابعة مهام أولادك الذين ليس لديهم هواتف، وقراءة أورادهم معك وتسجيل إنجازهم للمجموعة.
              </p>
              const isDone = assign.status === 'completed';
              const childMember = members.find(m => m.userId === assign.assignedToUserId);
              const avatar = childMember?.avatar || '👦';

              return (
                <div
                  key={`${assign.taskId}_${assign.cycleNumber}_${assign.unitNumber}`}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3.5 ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-stone-50 border-stone-200/90'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{avatar}</span>
                        <span className="text-xs font-bold text-stone-900">
                          {assign.assignedToName}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded bg-blue-100 text-blue-900 font-bold">
                          تابع لك
                        </span>
                      </div>
                      {isDone ? (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold flex items-center gap-1 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3" />
                          أُنجز الورد
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                          قيد الإنجاز
                        </span>
                    </div>

                    <div className="pr-7">
                      <h4 className="text-sm font-bold text-stone-900 font-amiri">
                        {assign.unitTitle}
                      </h4>
                      <span className="text-[11px] text-stone-500 block">
                        {assign.taskName} (الدورة {assign.cycleNumber})
                      </span>
                    </div>
                  </div>

                  {/* Actions for child */}
                  <div className="flex items-center gap-2 pt-2 border-t border-stone-200/60 flex-wrap">
                    {(assign.unitTitle?.includes('الجزء') || isQuranTask(assign.parentTask)) && (
                      <button
                        onClick={() => openQuranReader({
                          juzNumber: assign.unitNumber,
                          taskId: assign.taskId,
                          cycleNumber: assign.cycleNumber,
                          unitNumber: assign.unitNumber,
                          isCompleted: isDone,
                        className="py-1.5 px-3 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                        title="فتح وقراءة الجزء في المصحف مع ابنك"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-800" />
                        <span>📖 قراءة ورد {assign.assignedToName}</span>
                      </button>

                    {isDone ? (
                      <button
                        className="py-1.5 px-3 text-stone-500 hover:text-stone-800 rounded-xl text-xs font-semibold transition flex items-center gap-1 mr-auto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>تراجع</span>
                      </button>
                    ) : (
                      <button
                        className="py-1.5 px-3.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs mr-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>أتمّ {assign.assignedToName} ✨</span>
                      </button>
                  </div>
                </div>
              );
          </div>
        ) : myDependents.length > 0 ? (
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="font-bold block">لديك {myDependents.length} تابع في المجموعة:</span>
              <span className="text-[11px] text-blue-800">
              </span>
            </div>
            <button
              className="px-3 py-1.5 bg-blue-800 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shrink-0"
            >
              + إضافة تابع آخر
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-[11px] leading-relaxed">
              إذا كان لديك أولاد ليس لديهم هواتف، يمكنك إضافتهم إلى المجموعة ليقرؤوا أورادهم معك وتُبلّغ المجموعة بإنجازهم أولاً بأول وتشجعهم على ختم القرآن والأذكار.
            </p>
            <button
              className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shrink-0 shadow-2xs whitespace-nowrap"
            >
              + إضافة ابني للمجموعة
            </button>
          </div>
      </div>

      {/* Recurrence Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            recurrenceFilter === 'all'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          كافة المهام ({tasks.length})
        </button>
        <button
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            recurrenceFilter === 'daily'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          اليومية ({tasks.filter(t => t.recurrence === 'daily').length})
        </button>
        <button
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            recurrenceFilter === 'weekly'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          الأسبوعية ({tasks.filter(t => t.recurrence === 'weekly').length})
        </button>
        <button
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            recurrenceFilter === 'monthly'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          الشهرية ({tasks.filter(t => t.recurrence === 'monthly').length})
        </button>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
            <Compass className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-stone-600 text-sm">لا توجد مهام مطابقة في هذه الفئة بعد.</p>
            {isCurrentUserAdmin && (
              <button
                onClick={onOpenCreateTask}
                className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
              >
                إضافة مهمة جديدة للمجموعة
              </button>
          </div>
        ) : (
          filteredTasks.map(task => {
            const cycle = cycles[task.id];
            const taskAssigns = assignments[task.id] || [];
            const myAssigns = taskAssigns.filter(a => a.assignedToUserId === currentUser?.uid);
            
            // Progress Calculation
            const totalUnits = task.taskType === 'shared_target' 
              ? (task.targetTotal || 1000) 
              : (cycle?.totalUnits || task.unitCount || taskAssigns.length || 1);
            
            const completedUnits = task.taskType === 'shared_target' 
              ? (task.currentTotal || 0)
              : (cycle?.completedUnits || taskAssigns.filter(a => a.status === 'completed').length);

            const percentage = Math.min(100, Math.round((completedUnits / (totalUnits || 1)) * 100));

            return (
              <div
                key={task.id}
                className="bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow transition overflow-hidden"
              >
                {/* Task Header */}
                <div className="p-4 md:p-5 border-b border-stone-100 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-semibold">
                        {task.recurrence === 'daily' ? 'يومية' : task.recurrence === 'weekly' ? 'أسبوعية' : task.recurrence === 'monthly' ? 'شهرية' : 'لمرة واحدة'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-semibold border border-emerald-200/50">
                        {task.taskType === 'distributed' ? 'مهمة موزعة' : task.taskType === 'individual' ? 'ورد مستقل' : 'هدف جماعي مشترك'}
                      </span>
                      {isQuranTask(task) && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-semibold border border-amber-200/60">
                          📖 ختمة 30 جزء
                        </span>
                    </div>

                    <h3 className="text-base md:text-lg font-bold text-stone-900 pt-0.5">
                      {task.name}
                    </h3>

                    {task.instructions && (
                      <p className="text-xs text-stone-600 leading-relaxed max-w-xl">
                        {task.instructions}
                      </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCurrentUserAdmin && isQuranTask(task) && (
                      <button
                        className="flex items-center gap-1 text-[11px] text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 font-bold px-2.5 py-1.5 rounded-xl transition shadow-2xs"
                        title="تكليف بعض الأعضاء بأكثر من جزء (للأعداد الأقل من 30 عضواً)"
                      >
                        <Users className="w-3.5 h-3.5 text-amber-700" />
                        <span className="hidden sm:inline">تكليف بأكثر من جزء</span>
                        <span className="sm:hidden">تكليف</span>
                      </button>

                    <button
                      className="flex items-center gap-1 text-xs text-emerald-800 hover:text-emerald-900 font-semibold px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/70 transition shrink-0"
                    >
                      <span>التفاصيل</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Counter */}
                <div className="px-4 md:px-5 py-3 bg-stone-50/70 border-b border-stone-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-600 font-medium">
                      الإنجاز الجماعي الكلي:
                    </span>
                    <span className="font-bold text-emerald-900">
                      {completedUnits} / {totalUnits} {task.taskType === 'shared_target' ? '' : 'وحدة'} ({percentage}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Specific Section: My Assigned Units / Interactive Area */}
                <div className="p-4 md:p-5">
                  {task.taskType === 'shared_target' ? (
                    /* Shared Target Increment Section */
                    <div className="space-y-3">
                      <div className="text-xs text-stone-700 font-medium">
                        أضف إنجازك إلى الهدف المشترك:
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[10, 33, 100, 500].map(amt => (
                          <button
                            key={amt}
                            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            +{amt}
                          </button>

                        <div className="flex items-center gap-1.5 mr-auto">
                          <input
                            type="number"
                            placeholder="عدد مخصص"
                            className="w-24 text-xs px-2.5 py-1.5 rounded-xl border border-stone-300 text-stone-800 focus:outline-none focus:border-emerald-600"
                            value={customCounterInput[task.id] || ''}
                          />
                          <button
                            onClick={() => {
                              const val = customCounterInput[task.id];
                              if (val && val > 0) {
                                incrementSharedTarget(task.id, val);
                                setCustomCounterInput(prev => ({ ...prev, [task.id]: 0 }));
                              }
                            }}
                            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                          >
                            إضافة
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Distributed or Individual Units Assigned to Me */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                          <span>وردك المخصص في هذه الدورة:</span>
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {myAssigns.length > 0 ? `${myAssigns.length} مهمة مخصصة لك` : 'لم يتم تخصيص وحدات لك في هذه الدورة'}
                        </span>
                      </div>

                      {myAssigns.length === 0 ? (
                        <div className="p-4 bg-stone-50 rounded-2xl text-xs text-stone-600 text-center border border-dashed border-stone-200 space-y-2.5">
                          <p>أنت غير مسجل في وحدات هذه الدورة حالياً. يمكنك استعراض باقي أجزاء المجموعة من زر التفاصيل.</p>
                          {isQuranTask(task) && (
                            <button
                              className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition inline-flex items-center gap-1.5 shadow-xs"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                              <span>📖 فتح وقراءة المصحف الشريف</span>
                            </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {/* Quick Quran Reading Action Bar */}
                          {isQuranTask(task) && (
                            <div className="p-3.5 bg-gradient-to-l from-emerald-900 to-emerald-800 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs border border-emerald-700/80">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-950/60 flex items-center justify-center shrink-0 border border-emerald-600/40">
                                  <BookOpen className="w-5 h-5 text-amber-300" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-white font-amiri">المصحف الشريف المدمج</h4>
                                  <p className="text-[11px] text-emerald-200">انقر لقراءة وردك مباشرة بالرسم العثماني مع التمرير التلقائي للأعلى</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {myAssigns.map(u => (
                                  <button
                                    key={u.id}
                                    onClick={() => openQuranReader({
                                      juzNumber: u.unitNumber,
                                      taskId: task.id,
                                      cycleNumber: task.currentCycleNumber || 1,
                                      unitNumber: u.unitNumber,
                                      isCompleted: u.status === 'completed',
                                    className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-900 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                                  >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    <span>📖 قراءة {u.unitTitle}</span>
                                  </button>
                              </div>
                            </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {myAssigns.map(unit => {
                              const isDone = unit.status === 'completed';
                              const isExcused = unit.status === 'excused';

                              return (
                                <div
                                  key={unit.id}
                                  className={`p-3 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                                    isDone
                                      ? 'bg-emerald-50/70 border-emerald-200'
                                      : isExcused
                                      ? 'bg-amber-50/50 border-amber-200'
                                      : 'bg-white border-stone-200'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-sm font-bold text-stone-900 font-amiri">
                                        {unit.unitTitle}
                                      </h4>
                                      {isDone && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3" />
                                          مكتمل
                                        </span>
                                      {isExcused && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                                          معتذر
                                        </span>
                                    </div>

                                    {unit.completedAt && (
                                      <span className="text-[10px] text-stone-500 block mt-1">
                                      </span>
                                    {unit.excusedReason && (
                                      <span className="text-[10px] text-amber-800 block mt-1">
                                        سبب الاعتذار: {unit.excusedReason}
                                      </span>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-2 pt-1 border-t border-stone-100 flex-wrap">
                                    {(isQuranTask(task) || unit.unitTitle?.includes('الجزء') || (unit.unitNumber >= 1 && unit.unitNumber <= 30)) && (
                                      <button
                                        onClick={() => openQuranReader({
                                          juzNumber: unit.unitNumber,
                                          taskId: task.id,
                                          cycleNumber: task.currentCycleNumber || 1,
                                          unitNumber: unit.unitNumber,
                                          isCompleted: isDone,
                                        className="py-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                                        title="فتح وقراءة نص الجزء من المصحف الشريف"
                                      >
                                        <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                                        <span>📖 قراءة الجزء ({unit.unitNumber})</span>
                                      </button>

                                  {isDone ? (
                                    <button
                                      className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1 font-medium transition py-1 mr-auto"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>تراجع عن الإتمام</span>
                                    </button>
                                  ) : isExcused ? (
                                    <button
                                      className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                                    >
                                      العدول والإتمام (أتممت)
                                    </button>
                                  ) : (
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <button
                                        disabled={completingUnitId === unit.unitNumber}
                                        className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                                        <span>أتممت</span>
                                      </button>

                                      <button
                                        onClick={() => setExcuseDialogTarget({
                                          taskId: task.id,
                                          cycleNumber: task.currentCycleNumber || 1,
                                          unitNumber: unit.unitNumber
                                        title="أعتذر عن هذه المهمة لظرف طارئ"
                                        className="px-2.5 py-2 text-stone-500 hover:text-amber-800 bg-stone-100 hover:bg-amber-100 rounded-xl text-xs font-semibold transition"
                                      >
                                        اعتذار
                                      </button>
                                    </div>
                                </div>
                              </div>
                            );
                          </div>
                        </div>
                    </div>
                </div>
              </div>
            );
          })
      </div>

      {/* Excuse Modal */}
      {excuseDialogTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-stone-200">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900">أعتذر عن هذه المهمة</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                سيتم إشعار المشرف باعتذارك لإتاحة تدوير أو توزيع المهمة دون أي إحراج، ولن تسجل المهمة كمكتملة.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                سبب الاعتذار (اختياري):
              </label>
              <textarea
                value={excuseReason}
                placeholder="مثال: ظرف سفر طارئ، انشغال مؤقت..."
                className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-amber-600 resize-none h-20"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleConfirmExcuse}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                تأكيد الاعتذار
              </button>
              <button
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>

      {/* Quran Reader Modal (Requirement #3 & #4) */}
      {readingJuz && (
        <QuranReaderModal
          juzNumber={readingJuz.juzNumber}
          taskId={readingJuz.taskId}
          cycleNumber={readingJuz.cycleNumber}
          unitNumber={readingJuz.unitNumber}
          isCompleted={readingJuz.isCompleted}
          onMarkComplete={async (tId, cNum, uNum) => {
            const isOverdue = pendingOverdueAssignments.some(
              ov => ov.taskId === tId && ov.cycleNumber === cNum && ov.unitNumber === uNum
            );
            if (isOverdue) {
              await markPendingUnitCompleted(tId, cNum, uNum);
            } else {
              await handleMarkComplete(tId, cNum, uNum);
            }
            setReadingJuz(prev => prev ? { ...prev, isCompleted: true } : null);
          }}
          onUndoComplete={async (tId, cNum, uNum) => {
            await undoUnitCompleted(tId, cNum, uNum);
            setReadingJuz(prev => prev ? { ...prev, isCompleted: false } : null);
          }}
        />

      {/* Multi-Juz Assignment Modal for Admin (Requirement #5: less than 30 members) */}
      {multiJuzTask && (
        <MultiJuzAssignmentModal
          task={multiJuzTask}
        />

        />

    </div>
  );
};
