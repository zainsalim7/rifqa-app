import React, { useState } from 'react';
import { useGroup } from '../context/GroupContext';
import { useToast } from '../context/ToastContext';
import { X, Users, ArrowLeft } from 'lucide-react';

interface JoinGroupModalProps {
  onClose: () => void;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({ onClose }) => {
  const { joinGroupByCode } = useGroup();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await joinGroupByCode(code.trim());
      if (res.success) {
        showToast(res.message, 'success');
        onClose();
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الانضمام');
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
            <h3 className="text-base font-bold text-stone-900">الانضمام إلى مجموعة</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          أدخل رمز الدعوة الذي حصلت عليه من مشرف المجموعة (مثال: RIFQA-XXXX أو DEMO-QURAN).
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              رمز الدعوة:
            </label>
            <input
              type="text"
              required
              placeholder="RIFQA-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full text-center font-mono tracking-widest text-sm uppercase p-3 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              {loading ? 'جارٍ التحقق...' : 'انضمام الآن'}
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
