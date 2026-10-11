import React, { useState, useEffect } from 'react';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { Task, GroupMember } from '../types';
import { generateBalancedAssignments, generateSequentialQuranAssignments } from '../utils/rotation';
import { QURAN_30_JUZ } from '../utils/quranData';
import { X, RefreshCw, CheckCircle2, User, HelpCircle, Shuffle } from 'lucide-react';

interface AssignmentPreviewModalProps {
  task: Task;
  onClose: () => void;
}

export const AssignmentPreviewModal: React.FC<AssignmentPreviewModalProps> = ({
  task,
  onClose,
}) => {
  const { members, assignments, startNewCycle } = useGroup();
  const { showToast } = useToast();
  const nextCycleNumber = (task.currentCycleNumber || 1) + 1;

  const [plannedUnits, setPlannedUnits] = useState<{
    unitNumber: number;
    unitTitle: string;
    assignedToUserId: string;
    assignedToName: string;
  }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Generate initial balanced assignments for the next cycle
    let unitList: { unitNumber: number; unitTitle: string }[] = [];
    const prevAssigns = assignments[task.id] || [];
    if (task.unitTemplate === 'quran_30_juz') {
      unitList = QURAN_30_JUZ.map(j => ({ unitNumber: j.juzNumber, unitTitle: j.title }));
    } else {
      if (prevAssigns.length > 0) {
        unitList = prevAssigns.map(a => ({ unitNumber: a.unitNumber, unitTitle: a.unitTitle }));
      } else {
        const count = task.unitCount || 30;
        for (let i = 1; i <= count; i++) {
          unitList.push({ unitNumber: i, unitTitle: `الوحدة رقم ${i}` });
        }
      }
    }

    const prevList = prevAssigns.map(a => ({ unitNumber: a.unitNumber, assignedToUserId: a.assignedToUserId }));
    const rotated = task.unitTemplate === 'quran_30_juz'
      ? generateSequentialQuranAssignments(members, nextCycleNumber, prevList)
      : generateBalancedAssignments(unitList, members, nextCycleNumber, prevList);
    setPlannedUnits(rotated);
  }, [task, members, nextCycleNumber]);

  const handleMemberChange = (unitNumber: number, newUserId: string) => {
    const member = members.find(m => m.userId === newUserId);
    if (!member) return;

    setPlannedUnits(prev =>
      prev.map(u =>
        u.unitNumber === unitNumber
          ? { ...u, assignedToUserId: member.userId, assignedToName: member.displayName }
          : u
      )
    );
  };

  const handleConfirmAndStart = async () => {
    try {
      setSubmitting(true);
      await startNewCycle(task.id, plannedUnits);
      onClose();
      showToast(`تم بنجاح بدء الدورة رقم (${nextCycleNumber}) وتدوير المهام.`, 'success');
    } catch (e: any) {
      showToast(e.message || 'حدث خطأ أثناء بدء الدورة', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-emerald-950 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-900 font-bold">
                معاينة وضبط التدوير
              </span>
              <span className="text-xs text-emerald-300">
                الدورة القادمة #{nextCycleNumber}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">تدوير وتوزيع مهام "{task.name}"</h2>
            <p className="text-xs text-emerald-200 leading-relaxed max-w-xl">
              تم تدوير الأجزاء تلقائياً لتجنب تكرار نفس الجزء لنفس العضو في دورتين متتاليتين، مع توزيع متوازن. يمكنك تعديل أي تخصيص يدويًا قبل الاعتماد.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Summary */}
        <div className="p-4 bg-emerald-50/60 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-700" />
            <span>عدد المشاركين المتاحين للتوزيع: <strong>{members.length} أعضاء</strong></span>
          </div>
          <span className="text-emerald-800">
            متوسط الوحدات لكل عضو: ~{Math.ceil(plannedUnits.length / Math.max(1, members.length))}
          </span>
        </div>

        {/* Units Assignment Adjustment List */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plannedUnits.map(unit => (
              <div
                key={unit.unitNumber}
                className="p-3 bg-white rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-stone-900 block truncate font-amiri">
                    {unit.unitTitle}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    رقم الوحدة: {unit.unitNumber}
                  </span>
                </div>

                {/* Member selection dropdown */}
                <div className="shrink-0">
                  <select
                    value={unit.assignedToUserId}
                    onChange={(e) => handleMemberChange(unit.unitNumber, e.target.value)}
                    className="text-xs font-semibold px-2 py-1.5 rounded-xl border border-stone-300 bg-stone-50 text-stone-800 focus:outline-none focus:border-emerald-600 max-w-[130px] truncate"
                  >
                    {members.map(m => (
                      <option key={m.userId} value={m.userId}>
                        {m.displayName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          <div className="text-xs text-stone-500 hidden sm:block">
            سيتم حفظ لقطة (Snapshot) لهذه الدورة في سجلات المجموعة.
          </div>

          <div className="flex items-center gap-2 mr-auto sm:mr-0">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              disabled={submitting}
              onClick={handleConfirmAndStart}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>{submitting ? 'جارٍ الاعتماد...' : 'اعتماد التوزيع وبدء الدورة'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
