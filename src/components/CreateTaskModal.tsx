import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { TaskType, RecurrenceType } from '../types';
import { X, BookOpen, Clock, Users, Target, Check, Sparkles } from 'lucide-react';

interface CreateTaskModalProps {
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ onClose }) => {
  const { createTask, members } = useGroup();
  const { showToast } = useToast();

  const [taskType, setTaskType] = useState<TaskType>('distributed');
  const [unitTemplate, setUnitTemplate] = useState<'quran_30_juz' | 'custom'>('quran_30_juz');
  const [name, setName] = useState('ختمة القرآن الكريم الشهرية');
  const [instructions, setInstructions] = useState('قراءة الجزء الموزع وتدبره خلال مدة الدورة، ثم الضغط على "أتممت".');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [targetTotal, setTargetTotal] = useState<number>(10000);
  const [customUnitCount, setCustomUnitCount] = useState<number>(30);
  const [showNamesOnCompletion, setShowNamesOnCompletion] = useState<boolean>(true);
  const [reminderTime, setReminderTime] = useState<string>('20:00');
  const [loading, setLoading] = useState<boolean>(false);

  const applyPreset = (preset: 'quran' | 'kahf' | 'adhkar' | 'salawat') => {
    if (preset === 'quran') {
      setTaskType('distributed');
      setUnitTemplate('quran_30_juz');
      setName('ختمة القرآن الكريم الشهرية');
      setInstructions('توزيع أجزاء القرآن الثلاثين بين أعضاء المجموعة لتتم الختمة شهرياً.');
      setRecurrence('monthly');
      setShowNamesOnCompletion(true);
      setReminderTime('20:00');
    } else if (preset === 'kahf') {
      setTaskType('individual');
      setName('قراءة سورة الكهف يوم الجمعة');
      setInstructions('ورد قراءة سورة الكهف المباركة كل يوم جمعة.');
      setRecurrence('weekly');
      setShowNamesOnCompletion(true);
      setReminderTime('09:00');
    } else if (preset === 'adhkar') {
      setTaskType('individual');
      setName('أذكار الصباح والمساء');
      setInstructions('المحافظة على أذكار الصباح والمساء يومياً.');
      setRecurrence('daily');
      setShowNamesOnCompletion(true);
      setReminderTime('07:00');
    } else if (preset === 'salawat') {
      setTaskType('shared_target');
      setName('عشرة آلاف صلاة على النبي ﷺ');
      setInstructions('هدف مشترك تتسابق فيه المجموعة للصلاة على الحبيب المصطفى ﷺ.');
      setRecurrence('monthly');
      setTargetTotal(10000);
      setShowNamesOnCompletion(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await createTask({
        name: name.trim(),
        instructions: instructions.trim(),
        taskType,
        recurrence,
        unitTemplate: taskType === 'distributed' ? unitTemplate : undefined,
        unitCount: taskType === 'distributed' ? (unitTemplate === 'quran_30_juz' ? 30 : customUnitCount) : members.length,
        targetTotal: taskType === 'shared_target' ? targetTotal : undefined,
        showNamesOnCompletion,
        reminderTime,
      });
      showToast(`تم إنشاء مهمة "${name.trim()}" بنجاح!`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء إنشاء المهمة', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-emerald-950 text-white flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">إضافة مهمة جديدة للمجموعة</h2>
            <p className="text-xs text-emerald-200">
              حدد نوع المهمة، نمط التوزيع، والتكرار الدوري.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 space-y-2">
          <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>نماذج سريعة جاهزة:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => applyPreset('quran')}
              className="px-3 py-1.5 bg-white border border-emerald-200 hover:border-emerald-500 rounded-xl text-xs font-semibold text-emerald-900 transition shadow-xs"
            >
              📖 ختمة القرآن (30 جزء)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('kahf')}
              className="px-3 py-1.5 bg-white border border-emerald-200 hover:border-emerald-500 rounded-xl text-xs font-semibold text-emerald-900 transition shadow-xs"
            >
              🕌 سورة الكهف (أسبوعي)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('adhkar')}
              className="px-3 py-1.5 bg-white border border-emerald-200 hover:border-emerald-500 rounded-xl text-xs font-semibold text-emerald-900 transition shadow-xs"
            >
              ☀️ أذكار الصباح والمساء
            </button>
            <button
              type="button"
              onClick={() => applyPreset('salawat')}
              className="px-3 py-1.5 bg-white border border-emerald-200 hover:border-emerald-500 rounded-xl text-xs font-semibold text-emerald-900 transition shadow-xs"
            >
              📿 صلوات مشتركة (هدف عددي)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Task Type Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              نمط ونوع المهمة:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTaskType('distributed')}
                className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between ${
                  taskType === 'distributed'
                    ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/20'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs font-bold text-stone-900">مهمة موزعة</div>
                <div className="text-[11px] text-stone-500 mt-1">توزيع وحدات محددة بالتساوي بين الأعضاء (مثل أجزاء القرآن)</div>
              </button>

              <button
                type="button"
                onClick={() => setTaskType('individual')}
                className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between ${
                  taskType === 'individual'
                    ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/20'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs font-bold text-stone-900">ورد فردي مستقل</div>
                <div className="text-[11px] text-stone-500 mt-1">كل عضو يقوم بنفس الورد بشكل مستقل (كالأذكار)</div>
              </button>

              <button
                type="button"
                onClick={() => setTaskType('shared_target')}
                className={`p-3 rounded-2xl border text-right transition flex flex-col justify-between ${
                  taskType === 'shared_target'
                    ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/20'
                    : 'border-stone-200 hover:bg-stone-50'
                }`}
              >
                <div className="text-xs font-bold text-stone-900">هدف جماعي مشترك</div>
                <div className="text-[11px] text-stone-500 mt-1">عدد كلي تتشارك المجموعة في تحقيقه (كالصلوات)</div>
              </button>
            </div>
          </div>

          {/* If Distributed: Template */}
          {taskType === 'distributed' && (
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <label className="block text-xs font-bold text-stone-800">
                قالب الوحدات الموزعة:
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                  <input
                    type="radio"
                    name="template"
                    checked={unitTemplate === 'quran_30_juz'}
                    onChange={() => setUnitTemplate('quran_30_juz')}
                    className="text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>قالب القرآن الكريم (30 جزء كاملة وموثقة)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                  <input
                    type="radio"
                    name="template"
                    checked={unitTemplate === 'custom'}
                    onChange={() => setUnitTemplate('custom')}
                    className="text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>وحدات مخصصة</span>
                </label>
              </div>

              {unitTemplate === 'quran_30_juz' && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>توزيع ذكي وتدوير تسلسلي مع الشهر العربي:</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    {members.length < 30 ? (
                      <>عدد أعضاء المجموعة ({members.length}) أقل من 30: سيتم تلقائياً تكليف الرفاق بأكثر من جزء لتغطية الأجزاء الثلاثين كاملة، مع إمكانية تعديل حصة كل عضو يدويًا.</>
                    ) : (
                      <>سيتم توزيع الأجزاء الـ 30 على الرفاق، وعند نهاية كل شهر عربي تدور الختمة تسلسلياً (الجزء التالي لكل عضو).</>
                    )}
                  </p>
                </div>
              )}

              {unitTemplate === 'custom' && (
                <div className="pt-2">
                  <label className="block text-xs font-medium text-stone-600 mb-1">
                    عدد الوحدات المراد توزيعها:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={customUnitCount}
                    onChange={(e) => setCustomUnitCount(Number(e.target.value))}
                    className="w-32 text-xs p-2 rounded-xl border border-stone-300"
                  />
                </div>
              )}
            </div>
          )}

          {/* If Shared Target: Total */}
          {taskType === 'shared_target' && (
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                الهدف الرقمي الإجمالي للمجموعة:
              </label>
              <input
                type="number"
                min="10"
                step="100"
                value={targetTotal}
                onChange={(e) => setTargetTotal(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600"
                placeholder="مثال: 10000"
              />
            </div>
          )}

          {/* Task Name */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              اسم المهمة: *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: ختمة رمضان المباركة، ورد الاستغفار..."
              className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              إرشادات أو تفاصيل المهمة (اختياري):
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="توجيهات للأعضاء حول كيفية القراءة أو الإتمام..."
              className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 resize-none h-18"
            />
          </div>

          {/* Recurrence & Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                دورية التكرار:
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 bg-white"
              >
                <option value="daily">يومية</option>
                <option value="weekly">أسبوعية</option>
                <option value="monthly">شهرية</option>
                <option value="once">لمرة واحدة</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                وقت التذكير المفضل (بتوقيت عدن):
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 bg-white"
              />
            </div>
          </div>

          {/* Privacy setting */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
              <input
                type="checkbox"
                checked={showNamesOnCompletion}
                onChange={(e) => setShowNamesOnCompletion(e.target.checked)}
                className="rounded text-emerald-700 focus:ring-emerald-600"
              />
              <span>إظهار اسم العضو عند إتمام المهمة لباقي الرفاق (تشجيع بالمعروف)</span>
            </label>
            <p className="text-[11px] text-stone-500 mt-1 mr-5 leading-normal">
              في حال إلغاء التفعيل، يظهر الإنجاز كعدد كلي دون إظهار أسماء من أنجز ومن لم ينجز صوناً للخصوصية.
            </p>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'جارٍ الإنشاء...' : 'إنشاء وبدء المهمة'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
