import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { X, Heart, Sparkles, UserPlus } from 'lucide-react';

interface AddDependentModalProps {
  onClose: () => void;
  groupId?: string;
}

const RELATIONSHIP_OPTIONS = [
  { value: 'son', label: 'ابن', avatar: '👦' },
  { value: 'daughter', label: 'ابنة', avatar: '👧' },
  { value: 'child', label: 'طفل', avatar: '🧒' },
  { value: 'family_member', label: 'فرد من العائلة', avatar: '🏡' },
];

export const AddDependentModal: React.FC<AddDependentModalProps> = ({ onClose, groupId }) => {
  const { currentGroup, addDependentToGroup } = useGroup();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<'son' | 'daughter' | 'child' | 'family_member'>('son');
  const [avatar, setAvatar] = useState('👦');
  const [submitting, setSubmitting] = useState(false);

  const targetGroupId = groupId || currentGroup?.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('يرجى كتابة اسم الابن أو التابع', 'error');
      return;
    }

    if (!targetGroupId) {
      showToast('يرجى اختيار مجموعة أولاً', 'error');
      return;
    }

    try {
      setSubmitting(true);
      await addDependentToGroup(targetGroupId, {
        displayName: name.trim(),
        relationship,
        avatar,
      });

      showToast(`تمت إضافة ${name.trim()} إلى المجموعة بنجاح وتكليفه بالمتابعة تحت حسابك ✨`, 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'حدث خطأ أثناء إضافة التابع', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-stone-200 overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-l from-emerald-900 to-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-900 flex items-center justify-center text-xl shadow-sm">
              {avatar}
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold">
                إضافة ابن أو فرد تابع (بدون هاتف)
              </h2>
              <p className="text-xs text-emerald-200">
                تكليفه بورد مستقل ومتابعة إنجازه من حسابك
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-300 hover:text-white hover:bg-emerald-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4">
          
          {/* Explanation Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-stone-700 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>كيف تعمل مشاركة الأبناء التابعين؟</span>
            </div>
            <ul className="text-[11px] text-stone-600 space-y-1 list-disc list-inside leading-relaxed pr-1">
              <li>يُدرج ابنك كعضو مشارك بالاسم في المجموعة ويُخصص له جزء في الختمات والمهام.</li>
              <li>تظهر مهمته داخل واجهتك الرئيسية لتفتح له المصحف أو تسجل إنجازه نيابة عنه.</li>
              <li>عند تسجيل إتمامه، يُنشر إنجازه فوراً في سجل نشاط المجموعة تشجيعاً له واحتفاءً بختمته!</li>
            </ul>
          </div>

          {/* Child Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 block">
              اسم الابن أو التابع: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: عبدالله، سارة، محمد..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-3 rounded-2xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
              autoFocus
            />
          </div>

          {/* Relationship Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 block">
              صلة القرابة:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RELATIONSHIP_OPTIONS.map((opt) => {
                const isSelected = relationship === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setRelationship(opt.value as any);
                      setAvatar(opt.avatar);
                    }}
                    className={`p-2.5 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-base">{opt.avatar}</span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avatar Emoji Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-800 block">
              الرمز التعبيري المفضل:
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {['👦', '👧', '🧒', '👶', '🌟', '📖', '🕊️'].map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setAvatar(em)}
                  className={`w-10 h-10 rounded-2xl border text-lg flex items-center justify-center transition ${
                    avatar === em
                      ? 'bg-amber-100 border-amber-400 scale-110 shadow-xs'
                      : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'جارٍ الإضافة...' : 'إضافة وتكليف بالمهمة'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
