import React, { useState } from 'react';
import { X, Smartphone, Copy, Check, ExternalLink, Share2, AlertCircle, Shield } from 'lucide-react';

interface MobileShareModalProps {
  onClose: () => void;
}

export const MobileShareModal: React.FC<MobileShareModalProps> = ({ onClose }) => {
  const [copiedDev, setCopiedDev] = useState(false);
  const [copiedPre, setCopiedPre] = useState(false);
  const [selectedUrlType, setSelectedUrlType] = useState<'dev' | 'pre'>('dev');

  const devUrl = 'https://ais-dev-yjyql7tinccbn4mjxwcqgc-485443738619.europe-west1.run.app';
  const preUrl = 'https://ais-pre-yjyql7tinccbn4mjxwcqgc-485443738619.europe-west1.run.app';

  const activeUrl = selectedUrlType === 'dev' ? devUrl : preUrl;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(activeUrl)}`;

  const handleCopy = (url: string, type: 'dev' | 'pre') => {
    navigator.clipboard.writeText(url);
    if (type === 'dev') {
      setCopiedDev(true);
      setTimeout(() => setCopiedDev(false), 2500);
    } else {
      setCopiedPre(true);
      setTimeout(() => setCopiedPre(false), 2500);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'رفقة الإنجاز - المهام والأوراد الجماعية',
        text: 'رابط تطبيق رفقة الإنجاز على الجوال:',
        url: activeUrl,
      }).catch(() => {});
    } else {
      handleCopy(activeUrl, selectedUrlType);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl p-5 md:p-6 max-w-md w-full space-y-4 shadow-2xl border border-stone-200 text-center">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2 text-right">
            <Smartphone className="w-5 h-5 text-emerald-800" />
            <h3 className="text-base font-bold text-stone-900">روابط فتح التطبيق في الجوال</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security / Account Notice */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-right text-xs text-amber-950 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <Shield className="w-4 h-4 text-amber-700 shrink-0" />
            <span>شرط فتح الرابط في الجوال:</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-900/90">
            روابط Google AI Studio السحابية محمية بحساب المطور. <strong>يجب أن يكون متصفح الجوال مسجلاً الدخول بنفس بريدك في Google</strong> (<code>zainsalim7@gmail.com</code>)، وإلا ستظهر شاشة منع وصول (403) لعدم التحقق من الهوية.
          </p>
        </div>

        {/* URL Selector Tabs */}
        <div className="flex items-center justify-center gap-2 p-1 bg-stone-100 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setSelectedUrlType('dev')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              selectedUrlType === 'dev' ? 'bg-white text-emerald-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            الرابط المباشر (Dev)
          </button>
          <button
            onClick={() => setSelectedUrlType('pre')}
            className={`flex-1 py-1.5 rounded-lg transition ${
              selectedUrlType === 'pre' ? 'bg-white text-emerald-900 shadow-xs font-bold' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            رابط المعاينة (Preview)
          </button>
        </div>

        {/* QR Code Container */}
        <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 inline-block shadow-inner mx-auto">
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="w-44 h-44 mx-auto rounded-xl shadow-xs"
          />
          <span className="text-[10px] text-stone-400 mt-1.5 block">امسح الرمز بكاميرا الجوال</span>
        </div>

        {/* Links Display */}
        <div className="space-y-2 text-right">
          
          {/* Active URL box */}
          <div className="flex items-center gap-1.5 bg-stone-50 p-2 rounded-xl border border-stone-200">
            <input
              type="text"
              readOnly
              value={activeUrl}
              className="text-[10px] font-mono text-stone-700 bg-transparent flex-1 focus:outline-none text-left select-all truncate"
            />
            <button
              onClick={() => handleCopy(activeUrl, selectedUrlType)}
              className="p-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shrink-0"
              title="نسخ الرابط"
            >
              {(selectedUrlType === 'dev' ? copiedDev : copiedPre) ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          {(selectedUrlType === 'dev' ? copiedDev : copiedPre) && (
            <span className="text-[10px] text-emerald-700 font-bold block text-center">تم نسخ الرابط بنجاح!</span>
          )}

        </div>

        {/* Installation guide */}
        <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200/80 text-right text-[11px] text-emerald-950 space-y-0.5">
          <span className="font-bold block">💡 التثبيت كأيقونة على الجوال (PWA):</span>
          <p className="text-[10px] text-stone-600 leading-normal">
            • <strong>آيفون:</strong> من Safari اضغط مشاركة &gt; "إضافة إلى الصفحة الرئيسية".<br />
            • <strong>أندرويد:</strong> من Chrome اضغط القائمة &gt; "تثبيت التطبيق".
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleShare}
            className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة الرابط</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
