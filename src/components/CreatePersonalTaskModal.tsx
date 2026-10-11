import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  BookOpen, 
  Sparkles, 
  Bell, 
  Volume2, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ShieldCheck,
  Heart,
  Plus
} from 'lucide-react';
import { usePersonalTasks } from '../context/PersonalTasksContext';
import { useToast } from '../context/ToastContext';
import { PersonalTaskCategory, PersonalTaskFrequency } from '../types';

interface CreatePersonalTaskModalProps {
  onClose: () => void;
  defaultCategory?: PersonalTaskCategory;
}

export const CreatePersonalTaskModal: React.FC<CreatePersonalTaskModalProps> = ({
  onClose,
  defaultCategory = 'khatmah'
}) => {
  const { createPersonalTask } = usePersonalTasks();
  const { showToast } = useToast();

  const [category, setCategory] = useState<PersonalTaskCategory>(defaultCategory);
  const [title, setTitle] = useState(
    defaultCategory === 'khatmah' ? 'ختمتي المباركة الخاصة' :
    defaultCategory === 'dhikr' ? 'الاستغفار اليومي' :
    'وردي اليومي الخاص'
  );
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<PersonalTaskFrequency>('daily');
  
  // Khatmah specific
  const [khatmahDaysTarget, setKhatmahDaysTarget] = useState<number>(30); // 30 days = 1 juz/day
  
  // Dhikr specific
  const [dhikrTarget, setDhikrTarget] = useState<number>(1000);

  // Scheduling & Reminders
  const [targetDate, setTargetDate] = useState<string>(() => {
    // Default 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [targetTime, setTargetTime] = useState<string>('06:00');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(true);
  const [reminderTime, setReminderTime] = useState<string>('06:00');
  const [reminderSoundEnabled, setReminderSoundEnabled] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);

  // Quick Preset Handlers
  const handleSelectPresetKhatmah = (days: number, name: string) => {
    setCategory('khatmah');
    setTitle(name);
    setKhatmahDaysTarget(days);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setTargetDate(d.toISOString().split('T')[0]);
    setDescription(`ختمة فردية خلال ${days} يوماً بمعدل ${(30 / days).toFixed(1)} جزء يومياً.`);
  };

  const handleSelectPresetDhikr = (name: string, count: number) => {
    setCategory('dhikr');
    setTitle(name);
    setDhikrTarget(count);
    setDescription(`ورد ذكر يومي مستهدف: ${count} مرة.`);
  };

  const handleSelectPresetWird = (name: string, desc: string, time: string) => {
    setCategory('wird');
    setTitle(name);
    setDescription(desc);
    setTargetTime(time);
    setReminderTime(time);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('يرجى كتابة عنوان للبرنامج أو المهمة', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await createPersonalTask({
        title,
        category,
        description,
        targetCount: category === 'khatmah' ? 30 : (category === 'dhikr' ? dhikrTarget : 1),
        targetDate: category === 'khatmah' ? targetDate : (targetDate || undefined),
        targetTime: targetTime || undefined,
        reminderEnabled,
        reminderTime: reminderEnabled ? reminderTime : undefined,
        reminderSoundEnabled,
        frequency,
      });

      showToast('تم إنشاء برنامجك الخاص بنجاح! نسأل الله لك التوفيق والبركة 🌿', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء الإنشاء', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                برنامج ومهمة خاصة بي
                <span className="text-[10px] bg-amber-400 text-stone-950 font-bold px-2 py-0.5 rounded-full">
                  سري 🔒
                </span>
              </h3>
              <p className="text-xs text-emerald-200">
                لا تطلع عليها أي مجموعة، خاصة بك وحدك
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Privacy Guarantee Banner */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <span className="font-bold">ضمان السرية والخصوصية:</span> هذا الورد لن يظهر لأي عضو أو مشرف في أي مجموعة، ولن يتم نشره في أي سجل أنشطة عام.
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">نوع البرنامج الخاص</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategory('khatmah');
                  setTitle('ختمتي المباركة الخاصة');
                }}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  category === 'khatmah'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-600/20'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <BookOpen className="w-5 h-5 text-emerald-700" />
                <span className="text-xs">ختمة خاصة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('dhikr');
                  setTitle('الاستغفار اليومي');
                }}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  category === 'dhikr'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-600/20'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <Sparkles className="w-5 h-5 text-amber-600" />
                <span className="text-xs">ذكر وتسبيح</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('wird');
                  setTitle('وردي اليومي الخاص');
                }}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  category === 'wird'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-600/20'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <Heart className="w-5 h-5 text-rose-600" />
                <span className="text-xs">ورد عبادة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('custom');
                  setTitle('مهمتي الخاصة');
                }}
                className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                  category === 'custom'
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-600/20'
                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                }`}
              >
                <Lock className="w-5 h-5 text-stone-600" />
                <span className="text-xs">مهمة مخصصة</span>
              </button>
            </div>
          </div>

          {/* Quick Presets based on selected category */}
          {category === 'khatmah' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-600 block">نماذج سريعة لمدّة الختمة:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPresetKhatmah(30, 'ختمة شهرية (جزء يومياً)')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition text-right ${
                    khatmahDaysTarget === 30 ? 'bg-amber-100 border-amber-400 text-stone-900 font-bold' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  🌙 شهر (جزء يومياً)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPresetKhatmah(15, 'ختمة نصف شهرية (جزآن يومياً)')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition text-right ${
                    khatmahDaysTarget === 15 ? 'bg-amber-100 border-amber-400 text-stone-900 font-bold' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  ⚡ 15 يوماً (جزآن)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPresetKhatmah(10, 'ختمة العشر المباركة (3 أجزاء)')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition text-right ${
                    khatmahDaysTarget === 10 ? 'bg-amber-100 border-amber-400 text-stone-900 font-bold' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  🌟 10 أيام (3 أجزاء)
                </button>
              </div>
            </div>
          )}

          {category === 'dhikr' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-600 block">أذكار شائعة مقترحة:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPresetDhikr('الاستغفار (1000 مرة)', 1000)}
                  className="py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs text-right transition font-medium text-stone-800"
                >
                  📿 أستغفر الله (1000)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPresetDhikr('الصلاة على النبي ﷺ (500 مرة)', 500)}
                  className="py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs text-right transition font-medium text-stone-800"
                >
                  ✨ الصلاة على النبي (500)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPresetDhikr('لا إله إلا الله (1000 مرة)', 1000)}
                  className="py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs text-right transition font-medium text-stone-800"
                >
                  🌿 لا إله إلا الله (1000)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPresetDhikr('سبحان الله وبحمده (100 مرة)', 100)}
                  className="py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs text-right transition font-medium text-stone-800"
                >
                  🤍 سبحان الله وبحمده (100)
                </button>
              </div>
            </div>
          )}

          {category === 'wird' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-stone-600 block">أوراد وعبادات مقترحة:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPresetWird('سورة الملك قبل النوم', 'قراءة سورة الملك المانعة من عذاب القبر', '22:30')}
                  className="py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs text-right transition font-medium text-stone-800"
                >
                  📖 سورة الملك (قبل النوم)
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPresetWird('صلاة الوتر وركعتي الليل', 'قيام الليل وصلاة الوتر قبل الفجر', '04:30')}
                  className="py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs text-right transition font-medium text-stone-800"
                >
                  🌙 الوتر وقيام الليل
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPresetWird('أذكار الصباح', 'قراءة أذكار الصباح بعد صلاة الفجر', '05:45')}
                  className="py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs text-right transition font-medium text-stone-800"
                >
                  🌅 أذكار الصباح
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPresetWird('أذكار المساء', 'قراءة أذكار المساء بعد العصر', '17:00')}
                  className="py-2 px-3 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 text-xs text-right transition font-medium text-stone-800"
                >
                  🌇 أذكار المساء
                </button>
              </div>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              عنوان البرنامج أو الورد <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: ختمتي الفردية لشهر رجب، ورد 1000 استغفار، صلاة الوتر..."
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              required
            />
          </div>

          {/* Target Count if Dhikr */}
          {category === 'dhikr' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                الهدف اليومي المرجو (عدد المرات)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={dhikrTarget}
                  onChange={(e) => setDhikrTarget(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-32 px-4 py-2 rounded-xl border border-stone-300 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <span className="text-xs text-stone-500">مرة باليوم (مزود بمسبحة رقمية ذكية)</span>
              </div>
            </div>
          )}

          {/* Target Date for Khatmah or Task */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                تاريخ الانتهاء المستهدف {category === 'khatmah' && <span className="text-emerald-700">(موعد الختم)</span>}
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                التكرار والمتابعة
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as PersonalTaskFrequency)}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white"
              >
                <option value="daily">يومي (يتجدد كل يوم)</option>
                <option value="weekly">أسبوعي</option>
                <option value="specific_date">موعد محدد وتاريخ نهائي</option>
                <option value="open">مفتوح حسب الهمّة</option>
              </select>
            </div>
          </div>

          {/* Description / Personal Notes */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              ملاحظات أو نية خاصة (اختياري)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب نيتك، خواطرك، أو أي شرط تفرضه على نفسك لالتزام هذا الورد..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          {/* Reminder & Notification Section */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-stone-800">التنبيهات والتذكيرات اليومية</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
              </label>
            </div>

            {reminderEnabled && (
              <div className="pt-2 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">وقت التنبيه اليومي</label>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <span className="text-stone-700 font-medium flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-stone-500" />
                    رنين هادئ عند التنبيه
                  </span>
                  <input
                    type="checkbox"
                    checked={reminderSoundEnabled}
                    onChange={(e) => setReminderSoundEnabled(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600 h-4 w-4"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-medium hover:bg-stone-50 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 text-white font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting ? 'جارٍ الحفظ...' : 'اعتماد البرنامج الخاص 🔒'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
