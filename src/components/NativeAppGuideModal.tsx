import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Apple,
  Github,
  Bell,
  Cpu,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  FolderGit2,
  Download,
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Play,
  CheckCircle
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface NativeAppGuideModalProps {
  onClose: () => void;
}

export const NativeAppGuideModal: React.FC<NativeAppGuideModalProps> = ({ onClose }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'github' | 'actions' | 'fcm'>('github');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [githubUser, setGithubUser] = useState<string>('');
  const [githubRepo, setGithubRepo] = useState<string>('rifqa-app');

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    showToast('تم نسخ الأمر بنجاح!', 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const usernamePlaceholder = githubUser.trim() || 'YOUR_USERNAME';
  const repoPlaceholder = githubRepo.trim() || 'rifqa-app';

  const gitCommands = `# 1. ربط هذا المستودع بمستودعك الجديد على GitHub
git remote add origin https://github.com/${usernamePlaceholder}/${repoPlaceholder}.git

# 2. تعيين الفرع الرئيسي
git branch -M main

# 3. رفع كافة الملفات وتاريخ الالتزام إلى GitHub
git push -u origin main`;

  const gitCliCommands = `# أو يمكنك إنشاء المستودع ورفعه مباشرة بأمر واحد عبر GitHub CLI:
gh repo create ${repoPlaceholder} --public --source=. --remote=origin --push`;

  const androidBuildCommands = `# 1. تثبيت الحزم (إذا لزم)
npm install

# 2. بناء ملفات الويب وتحديث مجلد الأندرويد
npm run build:cap

# 3. فتح المشروع مباشرة في Android Studio
npm run cap:android`;

  const iosBuildCommands = `# 1. بناء ملفات الويب وتحديث مجلد الآيفون
npm run build:cap

# 2. فتح المشروع مباشرة في Xcode (على نظام macOS)
npm run cap:ios`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-700/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-amber-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              تطبيق أصيل للهواتف (Native Mobile App)
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              بناء تطبيق الـ APK والآيفون وحفظه في GitHub
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
              تم تجهيز بيئة Capacitor 8 رسمياً داخل الكود مع ملفات أندرويد و iOS وإشعارات الدفع الخارجية FCM.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors relative z-10"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50 overflow-x-auto scrollbar-none px-3 pt-2 gap-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl transition-all whitespace-nowrap ${
              activeTab === 'android'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-700 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            بناء أندرويد (APK)
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl transition-all whitespace-nowrap ${
              activeTab === 'ios'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-700 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Apple className="w-4 h-4 text-stone-800" />
            بناء آيفون (iOS)
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl transition-all whitespace-nowrap ${
              activeTab === 'github'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-700 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Github className="w-4 h-4 text-purple-700" />
            حفظ الكود في GitHub
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl transition-all whitespace-nowrap ${
              activeTab === 'actions'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-700 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Cpu className="w-4 h-4 text-blue-600" />
            البناء السحابي التلقائي
          </button>

          <button
            onClick={() => setActiveTab('fcm')}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl transition-all whitespace-nowrap ${
              activeTab === 'fcm'
                ? 'bg-white text-emerald-800 border-t-2 border-emerald-700 shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Bell className="w-4 h-4 text-amber-600" />
            إشعارات الدفع (FCM)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-right text-stone-700 text-sm">
          
          {/* Quick ZIP Download Banner */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-1.5">
                  أين تجد مجلد المشروع في جهازك؟
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-normal">
                    تحميل مباشر
                  </span>
                </h4>
                <p className="text-[11px] sm:text-xs text-amber-800/90 mt-0.5 leading-relaxed">
                  المشروع يعمل حالياً على سيرفر Google السحابي. يمكنك تحميل المجلد كاملاً بضغطة زر كملف ZIP إلى مجلد <strong>التنزيلات (Downloads)</strong> في جهازك.
                </p>
              </div>
            </div>
            <a
              href="/rifqa-app.zip"
              download="rifqa-app.zip"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold transition-all shadow-sm shrink-0 w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              تحميل المجلد كاملاً (ZIP)
            </a>
          </div>

          {/* TAB 1: ANDROID APK */}
          {activeTab === 'android' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-950 text-base">تم تجهيز مشروع الأندرويد بالكامل في الكود</h3>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    مجلد <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900 font-mono text-[11px]">android/</code> موجود الآن داخل ملفات مشروعك بمعرف حزمة <code className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900 font-mono text-[11px]">com.rifqa.app</code> وجاهز للتصدير كـ APK.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs">1</span>
                  تفعيل إشعارات FCM في الأندرويد (ملف google-services.json):
                </h4>
                <p className="text-xs text-stone-600 pr-8">
                  من لوحة تحكم <strong>Firebase Console</strong>، أضف تطبيق Android باسم الحزمة <code>com.rifqa.app</code>، ثم حمّل ملف <code>google-services.json</code> وضعه في هذا المسار بالمشروع:
                </p>
                <div className="mr-8 bg-stone-900 text-emerald-400 p-3 rounded-xl font-mono text-xs dir-ltr text-left flex items-center justify-between">
                  <span>android/app/google-services.json</span>
                  <button
                    onClick={() => copyToClipboard('android/app/google-services.json', 'path1')}
                    className="text-stone-400 hover:text-white transition-colors"
                  >
                    {copiedKey === 'path1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 pt-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs">2</span>
                  أوامر المزامنة وفتح Android Studio:
                </h4>
                <div className="mr-8 bg-stone-950 text-stone-200 p-3.5 rounded-2xl font-mono text-xs relative dir-ltr text-left">
                  <button
                    onClick={() => copyToClipboard(androidBuildCommands, 'cmd-android')}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1 font-sans"
                  >
                    {copiedKey === 'cmd-android' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    نسخ الأوامر
                  </button>
                  <pre className="whitespace-pre-wrap">{androidBuildCommands}</pre>
                </div>

                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 pt-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-xs">3</span>
                  استخراج ملف الـ APK النهائي:
                </h4>
                <div className="mr-8 bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs space-y-2">
                  <p className="font-semibold text-stone-800">
                    عندما يفتح Android Studio المشروع:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-stone-600">
                    <li>من القائمة العلوية اضغط <strong>Build</strong> ثم <strong>Build Bundle(s) / APK(s)</strong> ثم <strong>Build APK(s)</strong>.</li>
                    <li>خلال دقيقة، ستظهر لك رسالة في الزاوية تفيد باكتمال البناء مع زر <strong>locate</strong>.</li>
                    <li>ستجد ملف الـ <code>app-debug.apk</code> جاهزاً لترسله لهاتفك عبر واتساب، بلوتوث أو Google Drive وتثبيته فوراً!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IOS (IPHONE) */}
          {activeTab === 'ios' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-stone-900 text-white rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-stone-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">تم تجهيز مشروع الـ iOS في الكود</h3>
                  <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                    مجلد <code className="bg-stone-800 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">ios/</code> تم إنشاؤه وتهيئته بمشروع Xcode كامل باسم <code className="bg-stone-800 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[11px]">App.xcodeproj</code>.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs">1</span>
                  ملف Firebase لآيفون (GoogleService-Info.plist):
                </h4>
                <p className="text-xs text-stone-600 pr-8">
                  في لوحة تحكم Firebase، أضف تطبيق iOS بمعرف الحزمة <code>com.rifqa.app</code>، ثم حمّل ملف <code>GoogleService-Info.plist</code> وضعه داخل:
                </p>
                <div className="mr-8 bg-stone-900 text-amber-400 p-3 rounded-xl font-mono text-xs dir-ltr text-left flex items-center justify-between">
                  <span>ios/App/App/GoogleService-Info.plist</span>
                  <button
                    onClick={() => copyToClipboard('ios/App/App/GoogleService-Info.plist', 'path2')}
                    className="text-stone-400 hover:text-white transition-colors"
                  >
                    {copiedKey === 'path2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 pt-2">
                  <span className="w-6 h-6 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs">2</span>
                  أمر فتح المشروع في Xcode:
                </h4>
                <div className="mr-8 bg-stone-950 text-stone-200 p-3.5 rounded-2xl font-mono text-xs relative dir-ltr text-left">
                  <button
                    onClick={() => copyToClipboard(iosBuildCommands, 'cmd-ios')}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1 font-sans"
                  >
                    {copiedKey === 'cmd-ios' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    نسخ الأمر
                  </button>
                  <pre className="whitespace-pre-wrap">{iosBuildCommands}</pre>
                </div>

                <div className="mr-8 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <p>
                    ملاحظة: يتطلب بناء تطبيق الآيفون وجود جهاز Mac مع تطبيق Xcode مثبتاً، أو يمكنك استخدام خدمات سحابية مثل Codemagic أو GitHub Actions لبنائه في السحابة.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GITHUB REPO */}
          {activeTab === 'github' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-950 text-base">تم تهيئة Git وتجهيز ملفات المستودع</h3>
                  <p className="text-xs text-purple-800 mt-1 leading-relaxed">
                    تم إنشاء ملف <code>.gitignore</code> لحماية بياناتك، وإعداد ملف <code>README.md</code> شامل باللغة العربية والإنجليزية.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-800 text-white flex items-center justify-center text-xs">1</span>
                  إنشاء مستودع جديد على حسابك في GitHub:
                </h4>
                <p className="text-xs text-stone-600 pr-8">
                  افتح موقع GitHub وأنشئ مستودعاً جديداً (New Repository) فارغاً دون إضافة README أو .gitignore (لأننا جهزناها لك بالفعل).
                </p>
                <div className="pr-8">
                  <a
                    href="https://github.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-800 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    فتح صفحة إنشاء مستودع جديد على GitHub
                  </a>
                </div>

                {/* Input Fields to Customize Commands */}
                <div className="mr-8 bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 space-y-3">
                  <h5 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                    أدخل بيانات حسابك لتجهيز الأوامر المخصصة لك فوراً:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        اسم حسابك على GitHub (Username):
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: AhmedDev"
                        value={githubUser}
                        onChange={(e) => setGithubUser(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        اسم المستودع (Repository Name):
                      </label>
                      <input
                        type="text"
                        placeholder="rifqa-app"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-purple-200 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>

                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 pt-2">
                  <span className="w-6 h-6 rounded-full bg-purple-800 text-white flex items-center justify-center text-xs">2</span>
                  أوامر رفع الكود المباشرة (انسخها ونفّذها في مجلد مشروعك):
                </h4>
                <div className="mr-8 bg-stone-950 text-stone-200 p-4 rounded-2xl font-mono text-xs relative dir-ltr text-left">
                  <button
                    onClick={() => copyToClipboard(gitCommands, 'cmd-git')}
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1 font-sans"
                  >
                    {copiedKey === 'cmd-git' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    نسخ الأوامر
                  </button>
                  <pre className="whitespace-pre-wrap">{gitCommands}</pre>
                </div>

                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-2 pt-2">
                  <span className="w-6 h-6 rounded-full bg-purple-800 text-white flex items-center justify-center text-xs">3</span>
                  ملاحظة هامة حول كلمة المرور (Personal Access Token):
                </h4>
                <div className="mr-8 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1.5 leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    إذا طلب منك Git كلمة المرور (Password):
                  </p>
                  <p className="text-amber-900/90">
                    موقع GitHub لم يعد يقبل كلمة مرور الحساب العادية عند الدفع عبر سطر الأوامر، بل يتطلب <strong>Personal Access Token (PAT)</strong>:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-amber-900/80 pr-2">
                    <li>افتح GitHub &gt; إعدادات الحساب (Settings) &gt; <strong>Developer Settings</strong> في الأسفل.</li>
                    <li>اختر <strong>Personal access tokens (classic)</strong> &gt; <strong>Generate new token</strong>.</li>
                    <li>حدد صلاحية <strong>repo</strong> كاملة، ثم انسخ الرمز والصقه عندما يطلب منك Git كلمة المرور!</li>
                  </ol>
                </div>

                <div className="mr-8 p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1 text-stone-700">
                  <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ماذا سيحدث بعد تنفيذ هذه الأوامر؟
                  </p>
                  <p className="text-stone-600">
                    سيصبح الكود كاملاً مخزناً بأمان على حسابك في GitHub، مع تاريخ التغييرات ومشاريع أندرويد و iOS، كما سيبدأ GitHub Actions تلقائياً ببناء ملف الـ APK لك!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GITHUB ACTIONS (AUTO BUILD APK) */}
          {activeTab === 'actions' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-950 text-base">بناء تلقائي للـ APK في السحابة بدون برامج!</h3>
                  <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                    تمت إضافة ملف <code className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-900 font-mono text-[11px]">.github/workflows/build-apk.yml</code> لمشروعك تلقائياً.
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
                <p>
                  بمجرد رفعك للمشروع على GitHub كما هو موضح في تبويب GitHub، لن تحتاج حتى إلى تثبيت Android Studio على جهازك إذا كنت لا ترغب بذلك:
                </p>

                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">1</span>
                    <div>
                      <strong className="text-stone-900">سير العمل التلقائي:</strong>
                      <p className="text-stone-600 mt-0.5">سيرفرات GitHub ستقوم بتثبيت الحزم، تجميع كود React، وإعداد حزمة أندرويد و Gradle وبناء ملف الـ APK.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">2</span>
                    <div>
                      <strong className="text-stone-900">تحميل ملف الـ APK مباشرة:</strong>
                      <p className="text-stone-600 mt-0.5">
                        اذهب إلى تبويب <strong>Actions</strong> في مستودعك على GitHub، اضغط على أحدث عملية بناء (Build Android APK)، وستجد في الأسفل ملفاً قابلاً للتحميل باسم <strong>Rifqa-Android-APK</strong>!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">3</span>
                    <div>
                      <strong className="text-stone-900">التثبيت الفوري على الهاتف:</strong>
                      <p className="text-stone-600 mt-0.5">
                        فك ضغط الملف وقم بتثبيت <code>app-debug.apk</code> على أي هاتف أندرويد واستمتع بتطبيقك الحقيقي!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NATIVE FCM NOTIFICATIONS */}
          {activeTab === 'fcm' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-950 text-base">كيف تعمل الإشعارات الخارجية الحقيقية؟</h3>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    تم تضمين حزمة <code>@capacitor/push-notifications</code> وتجهيز مستمعات النظام. لا تعتمد هذه الإشعارات على المتصفح أو إشعارات الويب PWA، بل تصل مباشرة عبر خدمة <strong>Google Play Services</strong> أو <strong>Apple APNs</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-stone-700">
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <h5 className="font-bold text-stone-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    المسار التقني الكامل للإشعار:
                  </h5>
                  <ul className="list-disc list-inside space-y-1.5 text-stone-600 pr-2">
                    <li>عند فتح التطبيق لأول مرة كـ APK، يسأل نظام أندرويد المستخدم: "هل تسمح لتطبيق رفقة الإنجاز بإرسال إشعارات؟"</li>
                    <li>عند الموافقة، يُنشئ نظام التشغيل رمز جهاز فريد (Native FCM Token) ويرسله تلقائياً لقاعدة بيانات Firestore.</li>
                    <li>حتى إذا قام المستخدم بإغلاق التطبيق نهائياً أو إطفاء الشاشة، يظل الهاتف متصلاً بخوادم Google Play Services.</li>
                    <li>عندما ترسل إشعاراً من لوحة Firebase (Messaging) أو عبر Cloud Function، يصل التنبيه بصوت واهتزاز وشعار التطبيق فوراً!</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="font-bold text-emerald-900 block">إرسال إشعار تجريبي من Firebase:</span>
                  <p className="text-emerald-800">
                    توجه إلى لوحة تحكم Firebase لمشروعك &gt; <strong>Run</strong> &gt; <strong>Messaging</strong> &gt; اضغط <strong>Create your first campaign</strong> &gt; اختر <strong>Firebase Notification messages</strong> &gt; اكتب عنوان التذكير ورسالته واضغط <strong>Publish</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-stone-500 font-medium">
            حزمة التطبيق المعتمدة: <code className="bg-stone-200 px-1.5 py-0.5 rounded text-stone-800 font-mono">com.rifqa.app</code>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/rifqa-app.zip"
              download="rifqa-app.zip"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-all border border-stone-200"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              تحميل الكود (ZIP)
            </a>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              حسناً، فهمت ذلك
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
