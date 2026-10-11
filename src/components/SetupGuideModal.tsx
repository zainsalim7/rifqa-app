import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, Database, Smartphone, Bell, Flame } from 'lucide-react';

interface SetupGuideModalProps {
  onClose: () => void;
  onOpenFCM?: () => void;
  onOpenNative?: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ onClose, onOpenFCM, onOpenNative }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-stone-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-200 text-xs font-bold">
                حالة التطبيق والإعداد
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">دليل إعداد Firebase وحالة الخصائص</h2>
            <p className="text-xs text-stone-300">
              تفاصيل الخدمات المربوطة وما يحتاج ضبطاً خارجياً
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-6 text-stone-800 text-xs leading-relaxed">
          
          {/* Status Matrix */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>حالة الميزات والتكاملات البرمجية:</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <strong className="text-emerald-950 font-bold">قاعدة بيانات Firestore:</strong>
                </div>
                <p className="text-stone-600 text-[11px]">
                  مربوطة ومفعلة بنجاح، ويتم حفظ المجموعات والمهام والدورات وسجل النشاط بشكل دائم ومباشر.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <strong className="text-emerald-950 font-bold">قواعد الأمان (Security Rules):</strong>
                </div>
                <p className="text-stone-600 text-[11px]">
                  تم نشرها؛ تضمن خصوصية المجموعات وتمنع أي عضو من إتمام مهمة عضو آخر أو تعديل إعدادات المشرف.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <strong className="text-emerald-950 font-bold">تسجيل الدخول (Firebase Auth):</strong>
                </div>
                <p className="text-stone-600 text-[11px]">
                  يعمل عبر Google Popup المعتمد، مع وجود حسابات تجريبية سريعة لاختبار التفاعل والأدوار.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <strong className="text-emerald-950 font-bold">توقيت عدن (Asia/Aden):</strong>
                </div>
                <p className="text-stone-600 text-[11px]">
                  جميع التواريخ والتنبيهات وحسابات الدورات معتمدة على توقيت عدن بدقة وتنسيق عربي أصيل.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <strong className="text-emerald-950 font-bold">تطبيق ويب تقدمي (PWA):</strong>
                </div>
                <p className="text-stone-600 text-[11px]">
                  مهيأ تماماً للهواتف الذكية مع دعم الإضافة إلى الشاشة الرئيسية كـ App بدون متاجر.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                    <strong className="text-amber-950 font-bold">إشعارات الدفع الخارجية (FCM):</strong>
                  </div>
                  {onOpenFCM && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenFCM();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white font-bold text-[10px] transition shadow-2xs"
                    >
                      معالج الإعداد والخطوات 🚀
                    </button>
                  )}
                </div>
                <p className="text-amber-800 text-[11px]">
                  التطبيق يدعم إشعارات المتصفح الداخلية. لإرسال إشعارات أثناء إغلاق الهاتف تماماً، تم تجهيز Service Worker والربط مع Firebase Cloud Messaging.
                </p>
              </div>

            </div>
          </div>

          {/* Setup Guide Steps */}
          <div className="space-y-3 pt-2 border-t border-stone-200">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>دليل إعداد Firebase في بيئة الإنتاج:</span>
            </h3>

            <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                <div>
                  <strong>إعداد مشروع Firebase:</strong>
                  <p className="text-stone-600 text-[11px]">توجه إلى Firebase Console وأنشئ مشروعاً، وقم بتفعيل Cloud Firestore في وضع الإنتاج.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                <div>
                  <strong>تفعيل تسجيل الدخول بـ Google:</strong>
                  <p className="text-stone-600 text-[11px]">في Authentication &gt; Sign-in method، فعّل مزود Google وأضف النطاق المصرح به (Authorized Domain).</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                <div>
                  <strong>نشر القواعد (Firestore Rules):</strong>
                  <p className="text-stone-600 text-[11px]">القواعد المجهزة في ملف <code>firestore.rules</code> تغطي عزل بيانات المجموعات، وصلاحيات التبديل، ومنع تكرار الإتمام.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">4</span>
                <div>
                  <strong>تفعيل إشعارات الدفع الخارجية (FCM):</strong>
                  <p className="text-stone-600 text-[11px]">
                    من إعدادات المشروع (Project Settings) &gt; Cloud Messaging &gt; أنشئ VAPID Key pair لاستقبال الإشعارات خارج المتصفح.
                    {onOpenFCM && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenFCM();
                        }}
                        className="mr-2 text-emerald-800 hover:underline font-bold"
                      >
                        [عرض الخطوات بالتفصيل واستخراج رمز جهازك]
                      </button>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1 border-t border-stone-200">
                <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">5</span>
                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-between">
                    <strong>تطبيق الهاتف (APK للأندرويد و iOS) + GitHub:</strong>
                    {onOpenNative && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenNative();
                        }}
                        className="px-2 py-0.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-bold text-[10px] transition"
                      >
                        دليل البناء والـ GitHub 📱
                      </button>
                    )}
                  </div>
                  <p className="text-stone-600 text-[11px]">
                    المشروع جاهز بحزمة Capacitor 8 الأصلية مع إشعارات FCM الخارجية، وبناء آلي للـ APK عبر GitHub Actions.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-bold transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
