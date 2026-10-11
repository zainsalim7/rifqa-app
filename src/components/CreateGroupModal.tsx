import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { X, Users, BookOpen, Check } from 'lucide-react';

interface CreateGroupModalProps {
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ onClose }) => {
  const { createGroup } = useGroup();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [autoAddQuran, setAutoAddQuran] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await createGroup(name.trim(), description.trim(), autoAddQuran);
      showToast(`تم إنشاء مجموعة "${name.trim()}" بنجاح! يمكنك الآن دعوة رفاقك.`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء إنشاء المجموعة', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-bold text-stone-900">إنشاء مجموعة جديدة</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              اسم المجموعة: *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="مثال: ختمة الأهل، رفقة التدبر، مجالس الذكر..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 bg-stone-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              وصف المجموعة أو الهدف (اختياري):
            </label>
            <textarea
              placeholder="توضيح لأهداف الرفقة وبرنامجها المبارك..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600 resize-none h-18 bg-stone-50/50"
            />
          </div>

          {/* Quick Option: Add Quran 30 Juz task immediately */}
          <div 
            onClick={() => setAutoAddQuran(!autoAddQuran)}
            className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 cursor-pointer hover:bg-emerald-50 transition select-none"
          >
            <div className={`w-4 h-4 mt-0.5 rounded-md flex items-center justify-center text-white text-[10px] shrink-0 transition ${
              autoAddQuran ? 'bg-emerald-800' : 'border border-stone-300 bg-white'
            }`}>
              {autoAddQuran && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                <span>إضافة ختمة قرآن 30 جزء شهرياً فوراً</span>
              </span>
              <p className="text-[10px] text-emerald-800/80 leading-relaxed">
                يوزع التطبيق الأجزاء الـ 30 تلقائياً وبالتساوي بين من ينضم للمجموعة مع التدوير كل شهر.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء المجموعة'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
