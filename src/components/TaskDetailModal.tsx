import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { Task, TaskAssignment, GroupMember } from '../types';
import { formatDateTimeInAden } from '../utils/dateUtils';
import { QURAN_30_JUZ, isQuranTask } from '../utils/quranData';
import { QuranReaderModal } from './QuranReaderModal';
import { MultiJuzAssignmentModal } from './MultiJuzAssignmentModal';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  ArrowRightLeft, 
  RefreshCw, 
  User, 
  Users,
  ShieldAlert, 
  FileText, 
  AlertCircle,
  BookOpen
} from 'lucide-react';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onOpenRotationPreview: (task: Task) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onOpenRotationPreview,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { 
    currentGroup, 
    cycles, 
    assignments, 
    members, 
    isCurrentUserAdmin,
    isMyDependent,
    markUnitCompleted, 
    undoUnitCompleted,
    excuseUnit,
    requestSwap,
    reassignUnit
  } = useGroup();

  const [activeTab, setActiveTab] = useState<'units' | 'info'>('units');
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedMyUnit, setSelectedMyUnit] = useState<number | null>(null);
  const [selectedTargetUnit, setSelectedTargetUnit] = useState<number | null>(null);
  const [selectedTargetUser, setSelectedTargetUser] = useState<string | null>(null);
  const [readingJuz, setReadingJuz] = useState<{ juzNumber: number; unitNumber: number; isCompleted: boolean } | null>(null);
  const [multiJuzModalOpen, setMultiJuzModalOpen] = useState(false);

  const cycle = cycles[task.id];
  const taskAssigns = assignments[task.id] || [];
  const currentCycleNumber = task.currentCycleNumber || 1;

  const totalUnits = task.taskType === 'shared_target' 
    ? (task.targetTotal || 1000) 
    : (cycle?.totalUnits || task.unitCount || taskAssigns.length || 1);
  
  const completedUnits = task.taskType === 'shared_target' 
    ? (task.currentTotal || 0)
    : (cycle?.completedUnits || taskAssigns.filter(a => a.status === 'completed').length);

  const percentage = Math.min(100, Math.round((completedUnits / (totalUnits || 1)) * 100));

  const myUnits = taskAssigns.filter(a => a.assignedToUserId === currentUser?.uid);

  const handleStartSwap = (unitNumber: number) => {
    setSelectedMyUnit(unitNumber);
    setSwapModalOpen(true);
  };

  const handleConfirmSwap = async () => {
    if (!selectedMyUnit || !selectedTargetUnit || !selectedTargetUser) return;
    try {
      await requestSwap(task.id, selectedMyUnit, selectedTargetUser, selectedTargetUnit);
      setSwapModalOpen(false);
      setSelectedMyUnit(null);
      setSelectedTargetUnit(null);
      setSelectedTargetUser(null);
      showToast('تم إرسال طلب التبديل بنجاح، وسينفذ فور موافقة الطرف الآخر أو المشرف.', 'success');
    } catch (e: any) {
      showToast(e.message || 'حدث خطأ', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-stone-900 text-white flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-200 font-semibold">
                الدورة رقم {currentCycleNumber}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
                {task.recurrence === 'daily' ? 'يومية' : task.recurrence === 'weekly' ? 'أسبوعية' : 'شهرية'}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-stone-50">{task.name}</h2>
            {task.instructions && (
              <p className="text-xs text-stone-300 max-w-xl leading-relaxed">{task.instructions}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar & Actions */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <span>نسبة إنجاز الدورة الحالية:</span>
              <span className="text-emerald-800 font-bold">{completedUnits} من {totalUnits} ({percentage}%)</span>
            </div>
            <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isCurrentUserAdmin && isQuranTask(task) && (
              <button
                onClick={() => setMultiJuzModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap"
                title="تخصيص أكثر من جزء للأعضاء إذا كان العدد أقل من 30"
              >
                <Users className="w-3.5 h-3.5 text-amber-800" />
                <span>تكليف بأكثر من جزء (&lt;30)</span>
              </button>
            )}

            {isCurrentUserAdmin && task.taskType === 'distributed' && (
              <button
                onClick={() => onOpenRotationPreview(task)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-stone-900 rounded-xl text-xs font-bold transition shadow-xs whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تدوير وبدء الدورة التالية</span>
              </button>
            )}
          </div>
        </div>

        {/* Units / Grid Content */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-800" />
              <span>توزيع الوحدات والأجزاء بين الرفاق:</span>
            </h3>
            <span className="text-xs text-stone-500">
              إجمالي {taskAssigns.length} وحدة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {taskAssigns.map(unit => {
              const isMine = unit.assignedToUserId === currentUser?.uid;
              const isChildUnit = isMyDependent(unit.assignedToUserId) || (unit.parentUserId === currentUser?.uid && !isMine);
              const isDone = unit.status === 'completed';
              const isExcused = unit.status === 'excused';
              
              // Quran metadata helper
              const quranDetail = task.unitTemplate === 'quran_30_juz' 
                ? QURAN_30_JUZ.find(j => j.juzNumber === unit.unitNumber)
                : null;

              return (
                <div
                  key={unit.id}
                  className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-2.5 ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-300/80 shadow-xs'
                      : isExcused
                      ? 'bg-amber-50/60 border-amber-300/80'
                      : isMine
                      ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/20'
                      : isChildUnit
                      ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/15'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-stone-900 font-amiri">
                        {unit.unitTitle}
                      </span>
                      {isDone ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          أُنجز
                        </span>
                      ) : isExcused ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold shrink-0">
                          معتذر
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium shrink-0">
                          قيد الإنجاز
                        </span>
                      )}
                    </div>

                    {quranDetail && (
                      <p className="text-[10px] text-stone-500 line-clamp-1">
                        {quranDetail.description}
                      </p>
                    )}

                    {/* Assigned member info & admin reassign selector */}
                    {isCurrentUserAdmin ? (
                      <div className="flex items-center gap-1.5 pt-1">
                        <User className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="text-[10px] text-stone-500 shrink-0">المكلف:</span>
                        <select
                          value={unit.assignedToUserId}
                          onChange={(e) => reassignUnit(task.id, currentCycleNumber, unit.unitNumber, e.target.value)}
                          className="text-[11px] font-bold py-0.5 px-1.5 rounded-lg border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:border-emerald-600 max-w-[130px] truncate"
                          title="تغيير العضو المكلف بهذا الجزء"
                        >
                          {members.map(m => (
                            <option key={m.userId} value={m.userId}>
                              {m.displayName} {m.isDependent ? '👦' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px] text-stone-600 pt-1">
                        <User className="w-3 h-3 text-stone-400" />
                        <span className="truncate">
                          {isMine ? (
                            <strong className="text-emerald-800">مخصص لك</strong>
                          ) : isChildUnit ? (
                            <strong className="text-blue-800">مخصص لابنك ({unit.assignedToName}) 👦</strong>
                          ) : task.showNamesOnCompletion ? (
                            unit.assignedToName
                          ) : (
                            'مشارك في الختمة'
                          )}
                        </span>
                      </div>
                    )}

                    {unit.completedAt && (
                      <span className="text-[10px] text-stone-400 block">
                        أُنجز في: {formatDateTimeInAden(unit.completedAt)}
                      </span>
                    )}
                  </div>

                  {/* Actions for this unit */}
                  <div className="pt-2 border-t border-stone-100 flex items-center gap-1.5 flex-wrap">
                    {(isQuranTask(task) || unit.unitTitle?.includes('الجزء') || (unit.unitNumber >= 1 && unit.unitNumber <= 30)) && (
                      <button
                        onClick={() => setReadingJuz({
                          juzNumber: unit.unitNumber,
                          unitNumber: unit.unitNumber,
                          isCompleted: isDone
                        })}
                        className="py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1 transition"
                        title="فتح وقراءة نص الجزء في المصحف"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                        <span>📖 قراءة</span>
                      </button>
                    )}

                    {/* If assigned to current user, child, or admin */}
                    {(isMine || isChildUnit || isCurrentUserAdmin) && (
                      <>
                        {isDone ? (
                          <button
                            onClick={() => undoUnitCompleted(task.id, currentCycleNumber, unit.unitNumber)}
                            className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1 py-1 mr-auto"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>تراجع</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => markUnitCompleted(task.id, currentCycleNumber, unit.unitNumber)}
                            className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3 text-amber-300" />
                            <span>{isChildUnit ? `أتمّ ${unit.assignedToName} ✨` : 'أتممت'}</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Swap button if it belongs to me and not completed */}
                    {isMine && !isDone && (
                      <button
                        onClick={() => handleStartSwap(unit.unitNumber)}
                        title="طلب تبديل هذا الجزء مع رفيق آخر"
                        className="p-1.5 text-stone-500 hover:text-emerald-800 hover:bg-stone-100 rounded-lg text-xs font-semibold transition"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>

      {/* Quran Reader Modal */}
      {readingJuz && (
        <QuranReaderModal
          juzNumber={readingJuz.juzNumber}
          taskId={task.id}
          cycleNumber={currentCycleNumber}
          unitNumber={readingJuz.unitNumber}
          isCompleted={readingJuz.isCompleted}
          onMarkComplete={async (tId, cNum, uNum) => {
            await markUnitCompleted(tId, cNum, uNum);
            setReadingJuz(prev => prev ? { ...prev, isCompleted: true } : null);
          }}
          onUndoComplete={async (tId, cNum, uNum) => {
            await undoUnitCompleted(tId, cNum, uNum);
            setReadingJuz(prev => prev ? { ...prev, isCompleted: false } : null);
          }}
          onClose={() => setReadingJuz(null)}
        />
      )}

      {/* Multi-Juz Assignment Modal */}
      {multiJuzModalOpen && (
        <MultiJuzAssignmentModal
          task={task}
          onClose={() => setMultiJuzModalOpen(false)}
        />
      )}
      {swapModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-stone-200">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-800" />
                <span>طلب تبديل المهمة مع رفيق</span>
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                ترغب في تبديل مهمتك ({taskAssigns.find(a => a.unitNumber === selectedMyUnit)?.unitTitle}) مع أحد رفاقك. اختر الوحدة المطلوبة:
              </p>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {taskAssigns
                .filter(a => a.assignedToUserId !== currentUser?.uid && a.status !== 'completed')
                .map(target => (
                  <label
                    key={target.id}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      selectedTargetUnit === target.unitNumber
                        ? 'bg-emerald-50 border-emerald-600'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="targetUnit"
                        checked={selectedTargetUnit === target.unitNumber}
                        onChange={() => {
                          setSelectedTargetUnit(target.unitNumber);
                          setSelectedTargetUser(target.assignedToUserId);
                        }}
                        className="text-emerald-700 focus:ring-emerald-600"
                      />
                      <div>
                        <div className="text-xs font-bold text-stone-900">{target.unitTitle}</div>
                        <div className="text-[11px] text-stone-500">مخصص لـ: {target.assignedToName}</div>
                      </div>
                    </div>
                  </label>
                ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <button
                disabled={!selectedTargetUnit}
                onClick={handleConfirmSwap}
                className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                إرسال طلب التبديل
              </button>
              <button
                onClick={() => setSwapModalOpen(false)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
