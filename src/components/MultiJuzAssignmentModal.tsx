import React, { useState, useEffect } from 'react';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { Task, GroupMember } from '../types';
import { generateSequentialQuranAssignments, MemberJuzQuota } from '../utils/rotation';
import { QURAN_30_JUZ } from '../utils/quranData';
import { 
  X, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Sparkles, 
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface MultiJuzAssignmentModalProps {
  task: Task;
  onClose: () => void;
}

export const MultiJuzAssignmentModal: React.FC<MultiJuzAssignmentModalProps> = ({
  task,
  onClose,
}) => {
  const { members, assignments, startNewCycle, reassignUnit } = useGroup();
  const { showToast } = useToast();

  const currentCycleNumber = task.currentCycleNumber || 1;
  const currentAssigns = assignments[task.id] || [];

  // Member quotas map { userId: count }
  const [quotas, setQuotas] = useState<{ [userId: string]: number }>({});
  const [showDetailedMap, setShowDetailedMap] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize quotas from current assignments
  useEffect(() => {
    const initialQuotas: { [userId: string]: number } = {};
    members.forEach(m => {
      initialQuotas[m.userId] = 0;
    });

    if (currentAssigns.length > 0) {
      currentAssigns.forEach(a => {
        if (initialQuotas[a.assignedToUserId] !== undefined) {
          initialQuotas[a.assignedToUserId]++;
        } else {
          initialQuotas[a.assignedToUserId] = 1;
        }
      });
    } else {
      // If no assignments yet, distribute 30 evenly
      const mCount = Math.max(1, members.length);
      const basePerMember = Math.floor(30 / mCount);
      let remainder = 30 % mCount;

      members.forEach((m, idx) => {
        initialQuotas[m.userId] = basePerMember + (idx < remainder ? 1 : 0);
      });
    }

    setQuotas(initialQuotas);
  }, [members, currentAssigns]);

  const totalAssigned = Object.values(quotas).reduce((sum, count) => sum + count, 0);
  const remainingToAssign = 30 - totalAssigned;

  const handleUpdateQuota = (userId: string, delta: number) => {
    setQuotas(prev => {
      const current = prev[userId] || 0;
      const next = Math.max(0, current + delta);
      // Can't exceed 30
      if (delta > 0 && totalAssigned >= 30) return prev;
      return {
        ...prev,
        [userId]: next,
      };
    });
  };

  // Preset: Equal distribution
  const handleEqualDistribution = () => {
    const mCount = Math.max(1, members.length);
    const base = Math.floor(30 / mCount);
    let remainder = 30 % mCount;

    const newQuotas: { [userId: string]: number } = {};
    members.forEach((m, idx) => {
      newQuotas[m.userId] = base + (idx < remainder ? 1 : 0);
    });
    setQuotas(newQuotas);
  };

  const handleSaveAndApply = async () => {
    if (totalAssigned !== 30) {
      showToast(`يجب أن يكون مجموع الأجزاء الموزعة 30 جزءاً بالضبط (الموزع حالياً: ${totalAssigned})`, 'error');
      return;
    }

    try {
      setSubmitting(true);
      const quotaList: MemberJuzQuota[] = Object.entries(quotas).map(([userId, count]) => ({
        userId,
        count,
      }));

      // Generate planned units based on custom quotas
      const planned = generateSequentialQuranAssignments(members, currentCycleNumber, undefined, quotaList);

      // Start or refresh cycle with these units
      await startNewCycle(task.id, planned);
      showToast('تم بنجاح توزيع وتكليف الرفاق بالأجزاء الثلاثين للختمة!', 'success');
      onClose();
    } catch (e: any) {
      showToast(e.message || 'حدث خطأ أثناء حفظ التوزيع', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-stone-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-900 font-bold">
                توزيع الختمة (أقل من 30 عضواً)
              </span>
              <span className="text-xs text-stone-300">
                {members.length} أعضاء مسجلين
              </span>
            </div>
            <h2 className="text-xl font-bold text-stone-50">تكليف بعض الأعضاء بأكثر من جزء</h2>
            <p className="text-xs text-stone-300 leading-relaxed max-w-lg">
              لتكتمل الختمة الشريفة المكونة من 30 جزءاً، يمكنك هنا تحديد حصة كل عضو (جزء واحد، جزأين، 3 أجزاء...) بما يناسب قدرته وهمته.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Counter Summary Bar */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xs font-bold text-stone-700 flex items-center gap-2">
              <span>إجمالي الأجزاء الموزعة:</span>
              <span className={`text-sm font-extrabold ${totalAssigned === 30 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {totalAssigned} من 30 جزءاً
              </span>
            </div>
            {remainingToAssign !== 0 && (
              <span className="text-[11px] text-stone-500 block">
                {remainingToAssign > 0 
                  ? `💡 متبقي ${remainingToAssign} جزء بحاجة لتكليف أعضاء بها ليكتمل نصاب الـ 30.`
                  : `⚠️ تجاوزت العدد بـ ${Math.abs(remainingToAssign)} جزء، يرجى إنقاص التوزيع ليصبح 30.`}
              </span>
            )}
          </div>

          <button
            onClick={handleEqualDistribution}
            className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>توزيع تلقائي متكافئ على الجميع</span>
          </button>
        </div>

        {/* Member Quota List */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-3">
          <div className="text-xs font-bold text-stone-700 mb-2">
            حدد حصة كل عضو من أجزاء الختمة:
          </div>

          <div className="space-y-2.5">
            {members.map(member => {
              const currentQuota = quotas[member.userId] || 0;
              return (
                <div
                  key={member.userId}
                  className="p-3.5 rounded-2xl border border-stone-200 bg-white hover:border-emerald-300 transition flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 ${
                      member.isDependent ? 'bg-blue-100 text-blue-900 text-lg' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {member.isDependent ? (member.avatar || '👦') : member.displayName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-stone-900">
                          {member.displayName}
                        </h4>
                        {member.isDependent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-bold">
                            تابع
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500">
                        {member.isDependent 
                          ? `ابن/تابع لـ ${member.parentDisplayName || 'ولي الأمر'}`
                          : member.role === 'admin' ? 'مشرف المجموعة' : 'عضو في المجموعة'}
                      </span>
                    </div>
                  </div>

                  {/* Quota increment / decrement control */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 hidden sm:inline">نصيبه:</span>
                    <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200">
                      <button
                        onClick={() => handleUpdateQuota(member.userId, -1)}
                        disabled={currentQuota <= 0}
                        className="p-1 rounded-lg hover:bg-white text-stone-700 disabled:opacity-30 transition"
                        title="إنقاص جزء"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <span className="w-12 text-center text-xs font-extrabold text-stone-900">
                        {currentQuota} {currentQuota === 1 ? 'جزء' : currentQuota === 2 ? 'جزأين' : 'أجزاء'}
                      </span>

                      <button
                        onClick={() => handleUpdateQuota(member.userId, 1)}
                        disabled={totalAssigned >= 30}
                        className="p-1 rounded-lg hover:bg-white text-stone-700 disabled:opacity-30 transition"
                        title="زيادة جزء"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition"
          >
            إلغاء
          </button>

          <button
            onClick={handleSaveAndApply}
            disabled={totalAssigned !== 30 || submitting}
            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
            <span>{submitting ? 'جاري الحفظ...' : 'اعتماد التوزيع وتكليف الأعضاء'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
