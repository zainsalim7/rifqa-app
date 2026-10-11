import React from 'react';
import { useGroup } from '../context/GroupContext';
import { formatDateInAden } from '../utils/dateUtils';
import { BarChart3, CheckCircle2, BookOpen, Clock, HeartHandshake, ShieldCheck, Award } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { currentGroup, tasks, cycles, assignments, members } = useGroup();

  if (!currentGroup) {
    return (
      <div className="py-12 text-center text-xs text-stone-500">
        الرجاء اختيار مجموعة لعرض تقاريرها.
      </div>
    );
  }

  // Calculate collective totals
  let totalAllUnits = 0;
  let completedAllUnits = 0;

  tasks.forEach(t => {
    const cycle = cycles[t.id];
    const assignList = assignments[t.id] || [];
    if (t.taskType === 'shared_target') {
      totalAllUnits += (t.targetTotal || 1000);
      completedAllUnits += (t.currentTotal || 0);
    } else {
      totalAllUnits += (cycle?.totalUnits || t.unitCount || assignList.length || 1);
      completedAllUnits += (cycle?.completedUnits || assignList.filter(a => a.status === 'completed').length);
    }
  });

  const totalPercentage = totalAllUnits > 0 ? Math.min(100, Math.round((completedAllUnits / totalAllUnits) * 100)) : 0;

  return (
    <div className="space-y-6 pb-20">
      
      {/* Overview Stat Banner */}
      <div className="bg-gradient-to-br from-emerald-900 to-stone-900 text-white rounded-3xl p-6 shadow-md border border-emerald-800 space-y-4">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-800 text-amber-300 text-xs font-semibold">
            تقرير الإنجاز الجماعي الهادئ
          </span>
          <h2 className="text-xl md:text-2xl font-bold text-white">
            حصاد رفقة "{currentGroup.name}"
          </h2>
          <p className="text-xs text-emerald-200/90 leading-relaxed max-w-xl">
            نتابع الإنجاز الجماعي تعزيزاً للتعاون على البر والتقوى دون مقارنات فردية أو تصنيفات محرجة.
          </p>
        </div>

        {/* Highlight Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-800/80">
          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50 text-center">
            <span className="text-[11px] text-emerald-300 block">نسبة الإنجاز الكلية</span>
            <span className="text-2xl font-bold text-amber-300">{totalPercentage}%</span>
          </div>

          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50 text-center">
            <span className="text-[11px] text-emerald-300 block">الوحدات المكتملة</span>
            <span className="text-2xl font-bold text-white">{completedAllUnits}</span>
          </div>

          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50 text-center">
            <span className="text-[11px] text-emerald-300 block">إجمالي المهام الفعالة</span>
            <span className="text-2xl font-bold text-emerald-200">{tasks.length}</span>
          </div>

          <div className="bg-emerald-950/50 p-3 rounded-2xl border border-emerald-800/50 text-center">
            <span className="text-[11px] text-emerald-300 block">الرفاق المشاركون</span>
            <span className="text-2xl font-bold text-emerald-200">{members.length}</span>
          </div>
        </div>
      </div>

      {/* Breakdown By Task & Cycle */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-800" />
          <span>تفاصيل المهام والدورات الجارية:</span>
        </h3>

        {tasks.map(task => {
          const cycle = cycles[task.id];
          const assignList = assignments[task.id] || [];
          
          const total = task.taskType === 'shared_target' 
            ? (task.targetTotal || 1000) 
            : (cycle?.totalUnits || task.unitCount || assignList.length || 1);
          
          const done = task.taskType === 'shared_target' 
            ? (task.currentTotal || 0)
            : (cycle?.completedUnits || assignList.filter(a => a.status === 'completed').length);

          const excusedCount = assignList.filter(a => a.status === 'excused').length;
          const pendingCount = Math.max(0, total - done - excusedCount);
          const percent = Math.min(100, Math.round((done / total) * 100));

          return (
            <div key={task.id} className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 text-stone-600 font-semibold">
                      الدورة {task.currentCycleNumber || 1}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold">
                      {task.recurrence === 'daily' ? 'يومية' : task.recurrence === 'weekly' ? 'أسبوعية' : 'شهرية'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-stone-900">{task.name}</h4>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-sm font-bold text-emerald-900">{done} من {total}</span>
                  <span className="text-xs text-stone-400 block">({percent}% مكتمل)</span>
                </div>
              </div>

              {/* Progress visual bar */}
              <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${percent}%` }}
                  title={`مكتمل: ${done}`}
                />
                {excusedCount > 0 && (
                  <div
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{ width: `${Math.round((excusedCount / total) * 100)}%` }}
                    title={`معتذر: ${excusedCount}`}
                  />
                )}
              </div>

              {/* Distribution Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-900">
                  <span className="text-[10px] text-emerald-700 block">أُنجز</span>
                  <span className="font-bold text-sm">{done}</span>
                </div>
                <div className="p-2 rounded-xl bg-stone-50 text-stone-800">
                  <span className="text-[10px] text-stone-500 block">قيد الإنجاز</span>
                  <span className="font-bold text-sm">{pendingCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-900">
                  <span className="text-[10px] text-amber-700 block">معتذر (لإعادة التوزيع)</span>
                  <span className="font-bold text-sm">{excusedCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Respectful Note */}
      <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 text-xs text-stone-600 space-y-1">
        <span className="font-bold text-stone-800 flex items-center gap-1.5">
          <HeartHandshake className="w-4 h-4 text-emerald-700" />
          <span>مبدأ الرفقة المباركة:</span>
        </span>
        <p className="leading-relaxed">
          نحرص في "رفقة الإنجاز" على عدم إبراز أي قوائم لوم أو تصنيف متأخرين، بل نركز على تحقيق الهدف الجماعي وتيسير التبديل والاعتذار عند الظروف الطارئة بدون حرج.
        </p>
      </div>

    </div>
  );
};
