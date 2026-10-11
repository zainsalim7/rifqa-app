import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Key, 
  Send, 
  Smartphone, 
  Sparkles, 
  AlertCircle, 
  Code2, 
  Layers, 
  ChevronRight,
  Info,
  CheckCircle
} from 'lucide-react';
import { 
  checkFCMSupport, 
  registerFCMServiceWorker, 
  requestFCMToken, 
  saveFCMTokenToFirestore, 
  getStoredVapidKey, 
  setStoredVapidKey, 
  getStoredFCMToken,
  triggerLocalSWNotification 
} from '../utils/fcmService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface FCMSetupModalProps {
  onClose: () => void;
}

export const FCMSetupModal: React.FC<FCMSetupModalProps> = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [vapidKey, setVapidKey] = useState<string>(getStoredVapidKey());
  const [fcmToken, setFcmToken] = useState<string>(getStoredFCMToken());
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [swRegistered, setSwRegistered] = useState(false);
  const [isSupportedBrowser, setIsSupportedBrowser] = useState<boolean | null>(null);

  useEffect(() => {
    checkFCMSupport().then(supported => {
      setIsSupportedBrowser(supported);
      if (supported && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js').then(reg => {
          setSwRegistered(!!reg);
        });
      }
    });
  }, []);

  const handleCopyToken = () => {
    if (!fcmToken) return;
    navigator.clipboard.writeText(fcmToken);
    setCopiedToken(true);
    showToast('تم نسخ رمز الجهاز (FCM Token) بنجاح ✅', 'success');
    setTimeout(() => setCopiedToken(false), 2500);
  };

  const handleCopyCode = (codeStr: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedCode(true);
    showToast('تم نسخ كود الدالة بنجاح ✅', 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleRequestToken = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (vapidKey.trim()) {
        setStoredVapidKey(vapidKey.trim());
      }
      const res = await requestFCMToken(vapidKey.trim());
      if (res.token) {
        setFcmToken(res.token);
        setSwRegistered(true);
        showToast('تم توليد رمز الجهاز (FCM Token) بنجاح 🎉', 'success');
        
        if (currentUser) {
          await saveFCMTokenToFirestore(currentUser.uid, res.token);
        }
      } else {
        setErrorMsg(res.error || 'تعذر الحصول على الرمز');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'حدث خطأ أثناء الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLocalSW = async () => {
    try {
      const ok = await triggerLocalSWNotification(
        'رفقة الإنجاز 🌿 (اختبار إشعار خارجي)',
        'ما شاء الله! الخدمة تعمل بنجاح وجاهزة لاستقبال التنبيهات حتى بعد قفل التطبيق ✨'
      );
      if (ok) {
        showToast('تم إرسال إشعار تجريبي عبر Service Worker بنجاح 🔔', 'success');
      } else {
        showToast('يرجى التأكد من تفعيل إذن الإشعارات في متصفحك أولاً', 'error');
      }
    } catch {
      showToast('تعذر إرسال الإشعار التجريبي', 'error');
    }
  };

  const sampleCloudFunctionCode = `// Firebase Cloud Function (Node.js) لإرسال تذكيرات للأعضاء
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendDailyReminders = onSchedule("every day 20:00", async (event) => {
  const db = admin.firestore();
  
  // 1. جلب المستخدمين الذين لديهم رمز FCM
  const usersSnapshot = await db.collection("users")
    .where("fcmEnabled", "==", true)
    .get();

  const tokens = [];
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.lastFcmToken) {
      tokens.push(data.lastFcmToken);
    }
  });

  if (tokens.length === 0) return;

  // 2. إرسال إشعار الدفع
  const message = {
    notification: {
      title: "رفقة الإنجاز 🌿",
      body: "تذكير لطيف بأورادك ومهامك اليومية المباركة ✨"
    },
    tokens: tokens
  };

  const response = await admin.messaging().sendEachForMulticast(message);
  console.log("Sent notifications:", response.successCount);
});`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-stone-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-xs font-bold flex items-center gap-1">
                <Bell className="w-3.5 h-3.5" />
                <span>إشعارات الدفع الخارجية (FCM)</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 text-[10px] font-semibold">
                دليل الإعداد المتكامل
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">خطوات تفعيل إشعارات الدفع (Firebase Cloud Messaging)</h2>
            <p className="text-xs text-stone-300">
              لتصل التنبيهات للمستخدمين على هواتفهم وحواسيبهم حتى عند إغلاق التطبيق والمتصفح بالكامل.
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs */}
        <div className="bg-stone-100 p-2 border-b border-stone-200 flex items-center gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveStep(1)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeStep === 1 ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
            <span>استخراج VAPID Key</span>
          </button>

          <button
            onClick={() => setActiveStep(2)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeStep === 2 ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">2</span>
            <span>توليد رمز الجهاز (Token)</span>
          </button>

          <button
            onClick={() => setActiveStep(3)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeStep === 3 ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">3</span>
            <span>إرسال إشعار تجريبي مجاناً</span>
          </button>

          <button
            onClick={() => setActiveStep(4)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeStep === 4 ? 'bg-emerald-800 text-white shadow-xs' : 'text-stone-700 hover:bg-stone-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">4</span>
            <span>أتمتة التذكيرات (Cloud Functions)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-6 text-stone-800 text-xs leading-relaxed">
          
          {/* STEP 1 */}
          {activeStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-700" />
                  <strong className="text-amber-950 font-bold text-sm">
                    الخطوة 1: استخراج مفتاح الويب (VAPID Key) من لوحة Firebase
                  </strong>
                </div>
                <p className="text-stone-700 text-xs leading-relaxed">
                  مفتاح VAPID (Voluntary Application Server Identity) هو المفتاح العام المشفر الذي يسمح لمتصفحات الهواتف والكمبيوتر بالتحقق من أمان الإشعارات القادمة من مشروع Firebase الخاص بك.
                </p>
              </div>

              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <h4 className="font-bold text-stone-900 text-xs flex items-center gap-2">
                  <span>اتبّع الخطوات البسيطة التالية:</span>
                </h4>

                <ol className="space-y-2.5 list-decimal list-inside text-stone-700 text-xs leading-relaxed pr-1">
                  <li className="font-semibold text-stone-900">
                    افتح لوحة تحكم Firebase:
                    <a 
                      href="https://console.firebase.google.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold underline mr-1.5"
                    >
                      console.firebase.google.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    اختر مشروع التطبيق: <code className="bg-stone-200 px-1.5 py-0.5 rounded text-stone-900 font-bold">tahdeer-activation</code>
                  </li>
                  <li>
                    اضغط على أيقونة الإعدادات ⚙️ في أعلى القائمة الجانبية واختر <strong>Project settings (إعدادات المشروع)</strong>.
                  </li>
                  <li>
                    انتقل إلى علامة التبويب <strong>Cloud Messaging</strong>.
                  </li>
                  <li>
                    مرر لأسفل حتى تصل إلى قسم <strong>Web configuration (إعداد الويب)</strong>.
                  </li>
                  <li>
                    تحت عنوان <strong>Web Push certificates</strong>، اضغط على زر <strong>Generate key pair (إنشاء زوج مفاتيح)</strong>.
                  </li>
                  <li>
                    انسخ المفتاح الظاهر في عمود <strong>Key pair</strong> والصقه في الخطوة التالية.
                  </li>
                </ol>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs text-xs"
                >
                  <span>الانتقال للخطوة 2: لصق المفتاح وتوليد رمز الجهاز</span>
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-800" />
                  <strong className="text-emerald-950 font-bold text-sm">
                    الخطوة 2: تفعيل الخدمة واستخراج رمز الجهاز (Device Token)
                  </strong>
                </div>
                <p className="text-stone-700 text-xs leading-relaxed">
                  يقوم هذا المعالج بتسجيل ملف <code className="bg-white px-1 rounded text-stone-900 font-bold">/firebase-messaging-sw.js</code> وطلب إذن الإشعار، وتوليد الرمز الفريد الخاص بهاتفك أو متصفحك.
                </p>
              </div>

              {/* Status indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <span>دعم المتصفح لإشعارات الويب:</span>
                  <span className="font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> مدعوم ومجهز
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <span>ملف Service Worker الخلفي:</span>
                  <span className={`font-bold flex items-center gap-1 ${swRegistered ? 'text-emerald-800' : 'text-stone-600'}`}>
                    {swRegistered ? '✅ مسجل ونشط' : '⏳ سيتفعل عند طلب الرمز'}
                  </span>
                </div>
              </div>

              {/* VAPID Input Field */}
              <div className="space-y-1.5 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <label className="block font-bold text-stone-900 text-xs">
                  مفتاح VAPID Key (المنسوخ من لوحة Firebase):
                </label>
                <input
                  type="text"
                  placeholder="مثال: BBc0qjX8dYq-7a... (أو اتركه فارغاً إذا كنت تستخدم التكوين الافتراضي)"
                  value={vapidKey}
                  onChange={(e) => setVapidKey(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
                <p className="text-[11px] text-stone-500">
                  إذا لم تولد مفتاحاً بعد، يمكنك توليده في الخطوة 1، أو طلب الرمز مباشرة وسيقوم Firebase باستخدام المفتاح الافتراضي للمشروع.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleRequestToken}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition shadow-sm text-xs"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{loading ? 'جارٍ توليد الرمز...' : 'طلب إذن وتوليد رمز FCM لجهازي الآن'}</span>
                </button>

                <button
                  onClick={handleTestLocalSW}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold transition text-xs border border-stone-300"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>اختبار إشعار Service Worker تجريبي</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>تعذر توليد الرمز: </strong>
                    <span>{errorMsg}</span>
                  </div>
                </div>
              )}

              {/* Display Generated Token */}
              {fcmToken && (
                <div className="space-y-2 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-300 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>تم استخراج رمز جهازك (Device Token) بنجاح:</span>
                    </span>
                    <button
                      onClick={handleCopyToken}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition"
                    >
                      {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedToken ? 'تم النسخ!' : 'نسخ الرمز'}</span>
                    </button>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200 font-mono text-[11px] text-stone-800 break-all select-all max-h-24 overflow-y-auto">
                    {fcmToken}
                  </div>

                  <p className="text-[11px] text-emerald-900 font-semibold">
                    ✅ تم حفظ الرمز تلقائياً في ملف حسابك بـ Firestore. يمكنك الآن نسخ هذا الرمز وإرسال إشعار فوري من Firebase Console!
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveStep(3)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs text-xs"
                >
                  <span>الانتقال للخطوة 3: إرسال إشعار تجريبي من Firebase</span>
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {activeStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 space-y-2">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-amber-700" />
                  <strong className="text-amber-950 font-bold text-sm">
                    الخطوة 3: إرسال إشعار تجريبي مجاناً من Firebase Console
                  </strong>
                </div>
                <p className="text-stone-700 text-xs leading-relaxed">
                  لا تحتاج إلى كتابة سطر كود واحد لاختبار الإشعار الحقيقي! تتيح لك لوحة Firebase إرسال إشعار مخصص لأي جهاز محدد عبر رمزه.
                </p>
              </div>

              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <ol className="space-y-2.5 list-decimal list-inside text-stone-700 text-xs leading-relaxed pr-1">
                  <li>
                    توجه إلى لوحة تحكم Firebase:
                    <a 
                      href="https://console.firebase.google.com/project/tahdeer-activation/notification" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-800 hover:text-emerald-950 font-bold underline mr-1.5"
                    >
                      قسم المراسلة (Messaging) <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    اضغط على زر <strong>Create your first campaign (إنشاء حملتك الأولى)</strong> أو <strong>New campaign</strong>.
                  </li>
                  <li>
                    اختر <strong>Firebase Notification messages</strong>.
                  </li>
                  <li>
                    املأ حقول الإشعار:
                    <ul className="list-disc list-inside pr-4 pt-1 space-y-1 text-stone-600">
                      <li><strong>Notification title (العنوان):</strong> رفقة الإنجاز 🌿</li>
                      <li><strong>Notification text (نص الرسالة):</strong> حان موعد وردك القرآني اليومي المبارك! ✨</li>
                    </ul>
                  </li>
                  <li>
                    اضغط على زر <strong>Send test message (إرسال رسالة تجريبية)</strong> الموجود بجانب المعاينة على اليمين.
                  </li>
                  <li>
                    ألصق رمز جهازك <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-900 font-mono">FCM Token</code> (الذي نسخته من الخطوة 2) واضغط <strong>+</strong> ثم <strong>Test</strong>.
                  </li>
                  <li className="font-bold text-emerald-900">
                    🎉 مبروك! سيصل الإشعار إلى شاشتك مباشرة حتى لو كنت قد أغلقت نافذة التطبيق بالكامل!
                  </li>
                </ol>
              </div>

              {/* Quick Copy Token Button */}
              {fcmToken && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-emerald-950 block">رمز جهازك جاهز للنسخ:</span>
                    <span className="text-[11px] font-mono text-stone-600 truncate max-w-xs block">
                      {fcmToken.slice(0, 35)}...
                    </span>
                  </div>
                  <button
                    onClick={handleCopyToken}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition"
                  >
                    {copiedToken ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedToken ? 'تم النسخ!' : 'نسخ الرمز'}</span>
                  </button>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setActiveStep(2)}
                  className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-semibold text-xs"
                >
                  الرجوع للخطوة 2
                </button>
                <button
                  onClick={() => setActiveStep(4)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-xs text-xs"
                >
                  <span>الانتقال للخطوة 4: الأتمتة التلقائية</span>
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {activeStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-emerald-800" />
                  <strong className="text-emerald-950 font-bold text-sm">
                    الخطوة 4: إرسال الإشعارات تلقائياً يومياً (Cloud Functions أو Cron Job)
                  </strong>
                </div>
                <p className="text-stone-700 text-xs leading-relaxed">
                  لإرسال إشعار تذكيري آلي كل يوم عند وقت معين (مثلاً الساعة 8:00 مساءً بتوقيت عدن) لكل من لم ينجز ورده، يتم استخدام Firebase Cloud Functions المجدولة.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-xs">
                    كود الدالة المجدولة الجاهز (functions/index.js):
                  </span>
                  <button
                    onClick={() => handleCopyCode(sampleCloudFunctionCode)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-bold text-xs transition"
                  >
                    {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'تم النسخ!' : 'نسخ الكود'}</span>
                  </button>
                </div>

                <pre className="p-3 bg-stone-900 text-emerald-300 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed border border-stone-800 max-h-60" dir="ltr">
                  {sampleCloudFunctionCode}
                </pre>
              </div>

              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5 text-stone-700">
                <strong className="text-stone-900 block font-bold">طريقة النشر (Deploy):</strong>
                <p className="text-[11px]">
                  1. في مجلد مشروعك قم بتنفيذ: <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-900 font-mono">firebase init functions</code><br />
                  2. الصق الكود أعلاه في ملف <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-900 font-mono">index.js</code><br />
                  3. نفّذ الأمر: <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-900 font-mono">firebase deploy --only functions</code>
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <span className="text-[11px] text-stone-500">
            تطبيق رفقة الإنجاز • Firebase Cloud Messaging (Web Push API)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
