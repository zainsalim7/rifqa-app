import React, { useState } from 'react';
import { 
  Lock, 
  Plus, 
  BookOpen, 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Bell, 
  Trash2, 
  RotateCcw, 
  Flame, 
  Award, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink,
  Volume2,
  AlertCircle
} from 'lucide-react';
import { usePersonalTasks } from '../context/PersonalTasksContext';
import { useToast } from '../context/ToastContext';
import { PersonalTask, PersonalTaskCategory } from '../types';
import { CreatePersonalTaskModal } from './CreatePersonalTaskModal';
import { QURAN_30_JUZ } from '../utils/quranData';
import { formatTimeArabic } from '../utils/reminderService';

export const PersonalProgramView: React.FC = () => {
  const {
    personalTasks,
    loadingPersonalTasks,
    deletePersonalTask,
    togglePersonalUnit,
    incrementDhikr,
    resetDhikr,
    markCompletedToday,
    testPersonalReminder,
    openPersonalQuranReader,
    stats,
  } = usePersonalTasks();

  const { showToast } = useToast();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | PersonalTaskCategory>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createCategoryPreset, setCreateCategoryPreset] = useState<PersonalTaskCategory>('khatmah');

  // Selected Khatmah for detailed 30-Juz view (default to first active khatmah)
  const [expandedKhatmahId, setExpandedKhatmahId] = useState<string | null>(null);

  // In-app delete confirmation dialog
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<PersonalTask | null>(null);

  const filteredTasks = personalTasks.filter(task => {
    if (activeCategoryFilter === 'all') return true;
    return task.category === activeCategoryFilter;
  });

  const khatmahTasks = personalTasks.filter(t => t.category === 'khatmah');
  const dhikrTasks = personalTasks.filter(t => t.category === 'dhikr');
  const wirdTasks = personalTasks.filter(t => t.category === 'wird' || t.category === 'custom');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleDeleteTask = async () => {
    if (!deleteConfirmTarget) return;
    try {
      await deletePersonalTask(deleteConfirmTarget.id);
      showToast('تم حذف البرنامج الخاص بنجاح', 'info');
      setDeleteConfirmTarget(null);
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء الحذف', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/80">
        
        {/* Subtle decorative circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-emerald-800/80 border border-emerald-600/40 px-3 py-1 rounded-full text-xs text-amber-300 font-bold shadow-sm">
              <Lock className="w-3.5 h-3.5" />
              <span>خصوصية وسرية مطلقة 🔒</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              برنامجي الخاص وأورادي الفردية
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
              افرض على نفسك ختمات قرآنية وأوراد ذكر محددة بأوقات وتنبيهات اختيارية دون أن تطلع عليها مجموعاتك، واصل الالتزام وراقب إنجازك اليومي.
            </p>
          </div>

          <button
            onClick={() => {
              setCreateCategoryPreset('khatmah');
              setCreateModalOpen(true);
            }}
            className="self-start md:self-center px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة برنامج أو ورد جديد</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-800/60">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
            <div className="text-2xl font-black text-amber-300">{stats.totalActive}</div>
            <div className="text-[11px] text-emerald-200 mt-0.5">البرامج النشطة</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
            <div className="text-2xl font-black text-emerald-300">{stats.completedToday}</div>
            <div className="text-[11px] text-emerald-200 mt-0.5">أنجزتها اليوم 🌟</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
            <div className="text-2xl font-black text-amber-300">
              {stats.khatmahProgressPercent}%
            </div>
            <div className="text-[11px] text-emerald-200 mt-0.5">تقدم الختمة الخاصة</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
            <div className="text-2xl font-black text-amber-300 flex items-center justify-center gap-1">
              <span>{stats.highestStreak}</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-[11px] text-emerald-200 mt-0.5">سلسلة الالتزام</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setActiveCategoryFilter('all')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap ${
            activeCategoryFilter === 'all'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          جميع البرامج ({personalTasks.length})
        </button>
        <button
          onClick={() => setActiveCategoryFilter('khatmah')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeCategoryFilter === 'khatmah'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>الختمات القرآنية ({khatmahTasks.length})</span>
        </button>
        <button
          onClick={() => setActiveCategoryFilter('dhikr')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeCategoryFilter === 'dhikr'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>الذكر والتسبيح ({dhikrTasks.length})</span>
        </button>
        <button
          onClick={() => setActiveCategoryFilter('wird')}
          className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeCategoryFilter === 'wird'
              ? 'bg-emerald-800 text-white shadow-sm'
              : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>أوراد العبادة والمهام ({wirdTasks.length})</span>
        </button>
      </div>

      {/* Empty State */}
      {personalTasks.length === 0 && !loadingPersonalTasks && (
        <div className="bg-white rounded-3xl border border-dashed border-stone-300 p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 flex items-center justify-center text-3xl shadow-sm text-amber-800">
            🔒
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-bold text-lg text-stone-800">لم تُنشئ أي برنامج أو ورد خاص بك بعد</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              يمكنك الآن تكليف نفسك بختمة قرآنية فردية في وقت محدد، أو ورد استغفار وتسبيح يومي، أو قيام ليل وأذكار مع تنبيهات اختيارية دون أن تطلع عليها أي مجموعة.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setCreateCategoryPreset('khatmah');
                setCreateModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow transition flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>بدء ختمة قرآنية خاصة 📖</span>
            </button>
            <button
              onClick={() => {
                setCreateCategoryPreset('dhikr');
                setCreateModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-sm transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>ورد استغفار وتسبيح 📿</span>
            </button>
          </div>
        </div>
      )}

      {/* KHATMAH SECTION */}
      {khatmahTasks.length > 0 && (activeCategoryFilter === 'all' || activeCategoryFilter === 'khatmah') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-800" />
              <span>ختمتي القرآنية الخاصة</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {khatmahTasks.length}
              </span>
            </h2>
            <button
              onClick={() => {
                setCreateCategoryPreset('khatmah');
                setCreateModalOpen(true);
              }}
              className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ختمة أخرى</span>
            </button>
          </div>

          <div className="space-y-4">
            {khatmahTasks.map(task => {
              const completedUnits = task.completedUnits || [];
              const completedCount = completedUnits.length;
              const totalUnits = task.totalUnits || 30;
              const percent = Math.round((completedCount / totalUnits) * 100);
              const isExpanded = expandedKhatmahId === task.id || (expandedKhatmahId === null && khatmahTasks.length === 1);
              
              // Find next uncompleted juz
              let nextJuz = 1;
              for (let i = 1; i <= 30; i++) {
                if (!completedUnits.includes(i)) {
                  nextJuz = i;
                  break;
                }
              }

              // Target date calculation
              let daysRemaining = null;
              if (task.targetDate) {
                const target = new Date(task.targetDate);
                const now = new Date();
                const diffTime = target.getTime() - now.getTime();
                daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              }

              return (
                <div 
                  key={task.id} 
                  className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden transition hover:shadow-md"
                >
                  {/* Khatmah Card Top */}
                  <div className="p-5 sm:p-6 space-y-4 bg-gradient-to-b from-stone-50/60 to-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-emerald-800 text-amber-300 font-bold px-2 py-0.5 rounded-md">
                            ختمة فردية
                          </span>
                          <h3 className="font-extrabold text-base sm:text-lg text-stone-900">
                            {task.title}
                          </h3>
                        </div>
                        {task.description && (
                          <p className="text-xs text-stone-500 mt-1">{task.description}</p>
                        )}
                      </div>

                      {/* Reminder & Actions */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {task.reminderEnabled && (
                          <button
                            onClick={() => testPersonalReminder(task)}
                            className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition"
                            title="اختبار التنبيه الصوتي والإشعار"
                          >
                            <Bell className="w-3.5 h-3.5 text-amber-600" />
                            <span>{formatTimeArabic(task.reminderTime)}</span>
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirmTarget(task)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="حذف الختمة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar & Pace Details */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-900 flex items-center gap-1.5">
                          <span>الإنجاز: {completedCount} من {totalUnits} جزء</span>
                          {task.isCompleted && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full">
                              مكتملة بحمد الله ✨
                            </span>
                          )}
                        </span>
                        <span className="text-stone-700">{percent}%</span>
                      </div>

                      <div className="w-full bg-stone-200 h-3 rounded-full overflow-hidden p-0.5">
                        <div
                          className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 pt-1">
                        {daysRemaining !== null && (
                          <span>
                            {daysRemaining > 0 ? (
                              <span className="text-amber-700 font-bold">
                                ⏳ متبقٍ {daysRemaining} يوماً على الموعد المستهدف ({task.targetDate})
                              </span>
                            ) : daysRemaining === 0 ? (
                              <span className="text-emerald-700 font-bold">اليوم هو الموعد المستهدف!</span>
                            ) : (
                              <span className="text-stone-500">انقضى الموعد المستهدف</span>
                            )}
                          </span>
                        )}

                        {!task.isCompleted && (
                          <div className="flex items-center gap-2">
                            <span>الورد التالي: <strong className="text-stone-800">الجزء {nextJuz}</strong></span>
                            <button
                              onClick={() => openPersonalQuranReader(nextJuz, task.id)}
                              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm transition"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                              <span>اقرأ الآن في المصحف</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Toggle Detailed 30-Juz Grid */}
                    <button
                      onClick={() => setExpandedKhatmahId(isExpanded ? '' : task.id)}
                      className="text-xs text-stone-600 font-bold hover:text-emerald-800 flex items-center gap-1 pt-1"
                    >
                      <span>{isExpanded ? 'إخفاء شبكة الأجزاء الـ 30' : 'عرض شبكة الأجزاء الـ 30 والمتابعة'}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {/* 30-Juz Interactive Grid */}
                  {isExpanded && (
                    <div className="p-5 border-t border-stone-200 bg-stone-50/40 space-y-3">
                      <div className="flex items-center justify-between text-xs text-stone-600">
                        <span className="font-bold">انقر على أي جزء لقراءته في المصحف أو تحديد إتمامه:</span>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                            منجز
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-stone-300"></span>
                            متبقٍ
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
                        {Array.from({ length: 30 }, (_, idx) => idx + 1).map(juzNum => {
                          const isDone = completedUnits.includes(juzNum);
                          const juzInfo = QURAN_30_JUZ.find(j => j.juzNumber === juzNum);

                          return (
                            <div
                              key={juzNum}
                              className={`group relative rounded-2xl p-2 text-center border transition-all ${
                                isDone
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                  : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-400 hover:bg-emerald-50/40'
                              }`}
                            >
                              <div className="flex flex-col items-center gap-1">
                                <div className="text-[10px] text-stone-400">جزء</div>
                                <div className="text-sm font-extrabold">{juzNum}</div>
                                <div className="text-[9px] text-stone-500 truncate w-full px-0.5">
                                  {juzInfo?.title.replace('الجزء ', '') || ''}
                                </div>

                                <div className="flex items-center gap-1 mt-1">
                                  {/* Read in Quran button */}
                                  <button
                                    onClick={() => openPersonalQuranReader(juzNum, task.id)}
                                    className="p-1 rounded-md bg-stone-100 hover:bg-emerald-200 text-emerald-900 transition"
                                    title="فتح الجزء في المصحف"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                  </button>

                                  {/* Mark Complete Checkbox */}
                                  <button
                                    onClick={() => togglePersonalUnit(task.id, juzNum)}
                                    className={`p-1 rounded-md transition ${
                                      isDone
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-700'
                                    }`}
                                    title={isDone ? 'إلغاء الإتمام' : 'تحديد كمنجز'}
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DHIKR & TASBIH SECTION */}
      {dhikrTasks.length > 0 && (activeCategoryFilter === 'all' || activeCategoryFilter === 'dhikr') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>أوراد الذكر والاستغفار والتسبيح</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                {dhikrTasks.length}
              </span>
            </h2>
            <button
              onClick={() => {
                setCreateCategoryPreset('dhikr');
                setCreateModalOpen(true);
              }}
              className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ذكر جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dhikrTasks.map(task => {
              const current = task.currentCount || 0;
              const target = task.targetCount || 100;
              const percent = Math.min(100, Math.round((current / target) * 100));
              const isTargetReached = current >= target;

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-3xl border border-stone-200 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                        ورد تسبيح 📿
                      </span>
                      <div className="flex items-center gap-1">
                        {task.reminderEnabled && (
                          <button
                            onClick={() => testPersonalReminder(task)}
                            className="text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded-lg flex items-center gap-1"
                            title="تنبيه يومي"
                          >
                            <Bell className="w-3 h-3 text-amber-600" />
                            <span>{formatTimeArabic(task.reminderTime)}</span>
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirmTarget(task)}
                          className="p-1 text-stone-400 hover:text-red-600 rounded-lg transition"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-base text-stone-900">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-stone-500">{task.description}</p>
                    )}
                  </div>

                  {/* Interactive Digital Tasbih Counter */}
                  <div className="bg-gradient-to-b from-stone-50 to-amber-50/30 rounded-2xl p-4 border border-stone-200/80 flex flex-col items-center justify-center space-y-3">
                    
                    {/* Big Tap Button */}
                    <button
                      onClick={() => incrementDhikr(task.id, 1)}
                      className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-800 to-teal-700 text-white font-extrabold shadow-lg hover:shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center border-4 border-emerald-100 select-none cursor-pointer"
                    >
                      <span className="text-2xl font-black">{current}</span>
                      <span className="text-[10px] text-emerald-200">المس للعد 📿</span>
                    </button>

                    {/* Progress details */}
                    <div className="w-full space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-stone-600">
                        <span>الهدف: {target}</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Quick Increment & Reset Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => incrementDhikr(task.id, 10)}
                        className="px-2.5 py-1 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 active:scale-95 transition shadow-sm"
                      >
                        +10
                      </button>
                      <button
                        onClick={() => incrementDhikr(task.id, 33)}
                        className="px-2.5 py-1 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 active:scale-95 transition shadow-sm"
                      >
                        +33
                      </button>
                      <button
                        onClick={() => incrementDhikr(task.id, 100)}
                        className="px-2.5 py-1 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 active:scale-95 transition shadow-sm"
                      >
                        +100
                      </button>
                      <button
                        onClick={() => resetDhikr(task.id)}
                        className="px-2.5 py-1 rounded-xl bg-stone-100 text-stone-500 hover:text-stone-800 hover:bg-stone-200 text-xs font-bold transition"
                        title="تصفير العداد"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {isTargetReached && (
                      <div className="text-xs text-emerald-700 font-bold bg-emerald-100/80 px-3 py-1 rounded-full flex items-center gap-1 animate-fadeIn">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تم بلوغ الهدف اليوم، تقبل الله منك ✨</span>
                      </div>
                    )}
                  </div>

                  {/* Streak footer */}
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                    <span className="flex items-center gap-1 text-orange-600 font-bold">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{task.streakDays || 0} أيام متتالية</span>
                    </span>
                    <span>{task.frequency === 'daily' ? 'ورد يومي' : 'مفتوح'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* WIRD & CUSTOM TASKS SECTION */}
      {wirdTasks.length > 0 && (activeCategoryFilter === 'all' || activeCategoryFilter === 'wird' || activeCategoryFilter === 'custom') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-800 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-600" />
              <span>أوراد العبادة والمهام الخاصة</span>
              <span className="text-[10px] bg-rose-100 text-rose-900 font-bold px-2 py-0.5 rounded-full">
                {wirdTasks.length}
              </span>
            </h2>
            <button
              onClick={() => {
                setCreateCategoryPreset('wird');
                setCreateModalOpen(true);
              }}
              className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ورد عبادة جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wirdTasks.map(task => {
              const isCompletedToday = task.lastCompletedDate === todayStr;

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-3xl border p-5 shadow-sm space-y-4 transition ${
                    isCompletedToday ? 'border-emerald-300 bg-emerald-50/20' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-rose-100 text-rose-900 font-bold px-2 py-0.5 rounded-md">
                      {task.category === 'wird' ? 'ورد عبادة' : 'مهمة خاصة'}
                    </span>
                    <div className="flex items-center gap-1">
                      {task.reminderEnabled && (
                        <button
                          onClick={() => testPersonalReminder(task)}
                          className="text-[11px] bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-1 rounded-lg flex items-center gap-1"
                          title="تنبيه"
                        >
                          <Bell className="w-3 h-3 text-amber-600" />
                          <span>{formatTimeArabic(task.reminderTime)}</span>
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirmTarget(task)}
                        className="p-1 text-stone-400 hover:text-red-600 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-stone-900">{task.title}</h3>
                    {task.description && (
                      <p className="text-xs text-stone-500 mt-1">{task.description}</p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="text-[11px] text-stone-500 flex items-center gap-2">
                      {task.streakDays && task.streakDays > 0 ? (
                        <span className="flex items-center gap-1 text-orange-600 font-bold">
                          <Flame className="w-3.5 h-3.5" />
                          <span>{task.streakDays} أيام متواصلة</span>
                        </span>
                      ) : null}
                    </div>

                    <button
                      onClick={() => markCompletedToday(task.id)}
                      className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-sm ${
                        isCompletedToday
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isCompletedToday ? 'أنجزت اليوم ✓' : 'تسجيل الإنجاز اليوم'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-stone-200 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">حذف البرنامج الخاص</h3>
              <p className="text-xs text-stone-500 mt-1">
                هل أنت متأكد من حذف "{deleteConfirmTarget.title}"؟ سيتم حذف بيانات التقدم والتذكير الخاصة به.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteTask}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <CreatePersonalTaskModal
          onClose={() => setCreateModalOpen(false)}
          defaultCategory={createCategoryPreset}
        />
      )}

    </div>
  );
};
