import React from 'react';
import { useAuth, PRESET_DEMO_USERS, DemoUserOption } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { X, UserCheck, LogIn, Sparkles, Shield, User } from 'lucide-react';

interface UserSwitcherModalProps {
  onClose: () => void;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({ onClose }) => {
  const { currentUser, signInWithGoogle, signInAsDemoUser, isDemoUser } = useAuth();
  const { showToast } = useToast();

  const handleSelectDemo = async (demoUser: DemoUserOption) => {
    await signInAsDemoUser(demoUser);
    showToast(`تم التبديل إلى حساب: ${demoUser.displayName} (${demoUser.roleHint})`, 'info');
    onClose();
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      showToast('تم تسجيل الدخول بنجاح!', 'success');
      onClose();
    } catch (e: any) {
      showToast(e.message || 'فشل تسجيل الدخول بـ Google', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl border border-stone-200">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-bold text-stone-900">تسجيل الدخول وتبديل الحساب</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          يمكنك تسجيل الدخول بحسابك الحقيقي عبر Google، أو التبديل الفوري بين حسابات الرفاق لاختبار صلاحيات المشرف والعضو وإتمام المهام من وجهات نظر متعددة.
        </p>

        {/* Real Google Login Option */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
            الحساب الحقيقي:
          </span>
          <button
            onClick={handleGoogleSignIn}
            className="w-full p-3 rounded-2xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>تسجيل الدخول بحساب Google (المعتمد)</span>
          </button>
        </div>

        {/* Demo Accounts List */}
        <div className="space-y-2 pt-2 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              حسابات تجريبية سريعة للاختبار:
            </span>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-semibold">
              لتجربة الصلاحيات
            </span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {PRESET_DEMO_USERS.map(demo => {
              const isCurrent = currentUser?.uid === demo.uid;

              return (
                <button
                  key={demo.uid}
                  onClick={() => handleSelectDemo(demo)}
                  className={`w-full p-2.5 rounded-2xl border text-right transition flex items-center justify-between gap-2 ${
                    isCurrent
                      ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/20'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{demo.avatar}</span>
                    <div>
                      <div className="text-xs font-bold text-stone-900">{demo.displayName}</div>
                      <div className="text-[10px] text-stone-500">{demo.email}</div>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    demo.roleHint.includes('مدير')
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-stone-100 text-stone-700'
                  }`}>
                    {demo.roleHint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
