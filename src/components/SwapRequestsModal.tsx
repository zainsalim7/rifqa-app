import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { formatDateTimeInAden } from '../utils/dateUtils';
import { X, ArrowRightLeft, Check, Ban, Clock } from 'lucide-react';

interface SwapRequestsModalProps {
  onClose: () => void;
}

export const SwapRequestsModal: React.FC<SwapRequestsModalProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { swapRequests, respondToSwap, isCurrentUserAdmin } = useGroup();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-stone-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-stone-900">طلبات تبديل المهام بين الرفاق</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          يتيح نظام التبديل للرفاق تبادل الأجزاء أو المهام برضا الطرفين أو باعتماد المشرف، دون الإخلال بجدول الختمة.
        </p>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {swapRequests.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500">
              لا توجد طلبات تبديل حالياً.
            </div>
          ) : (
            swapRequests.map(swap => {
              const canRespond = (swap.targetUserId === currentUser?.uid || isCurrentUserAdmin) && swap.status === 'pending';
              const isMine = swap.requesterUserId === currentUser?.uid;

              return (
                <div
                  key={swap.id}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    swap.status === 'pending'
                      ? 'bg-amber-50/50 border-amber-200'
                      : swap.status === 'accepted'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-stone-50 border-stone-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-800">{swap.taskName}</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      swap.status === 'pending'
                        ? 'bg-amber-200 text-amber-900'
                        : swap.status === 'accepted'
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-stone-200 text-stone-700'
                    }`}>
                      {swap.status === 'pending' ? 'بانتظار الرد' : swap.status === 'accepted' ? 'تم التبديل' : 'مرفوض'}
                    </span>
                  </div>

                  {/* Swap comparison */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-2.5 rounded-xl border border-stone-200/80">
                    <div>
                      <span className="text-[10px] text-stone-400 block">طالب التبديل:</span>
                      <strong className="text-stone-900 block truncate">{swap.requesterName}</strong>
                      <span className="text-stone-600 text-[11px] font-amiri">{swap.requesterUnitTitle}</span>
                    </div>

                    <div className="border-r border-stone-100 pr-2">
                      <span className="text-[10px] text-stone-400 block">المطلوب منه:</span>
                      <strong className="text-stone-900 block truncate">{swap.targetName}</strong>
                      <span className="text-stone-600 text-[11px] font-amiri">{swap.targetUnitTitle}</span>
                    </div>
                  </div>

                  {canRespond && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => respondToSwap(swap.id, true)}
                        className="flex-1 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>قبول التبديل</span>
                      </button>
                      <button
                        onClick={() => respondToSwap(swap.id, false)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-700 rounded-xl text-xs font-semibold transition"
                      >
                        رفض
                      </button>
                    </div>
                  )}

                  {!canRespond && swap.status === 'pending' && isMine && (
                    <div className="text-[11px] text-amber-800 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>في انتظار رد رفيقك أو اعتماد المشرف.</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
