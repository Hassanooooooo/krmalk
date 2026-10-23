import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall.ts';

interface MobileTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileTestModal({ isOpen, onClose }: MobileTestModalProps) {
  const [copied, setCopied] = useState(false);
  const { isInstallable, install, isIOS } = usePWAInstall();

  // Use the canonical production shared URL or current origin
  const mobileUrl =
    typeof window !== 'undefined'
      ? window.location.origin.includes('localhost')
        ? 'https://ais-pre-ptyn3i26hne2rcmu34y6jc-557892722823.europe-west2.run.app'
        : window.location.href
      : 'https://ais-pre-ptyn3i26hne2rcmu34y6jc-557892722823.europe-west2.run.app';

  if (!isOpen) return null;

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSendToWhatsApp = () => {
    const text = encodeURIComponent(
      `رابط النسخة التجريبية لتطبيق كرمالك (مخيم الوافدين) على الموبايل:\n${mobileUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // QR Code URL using standard qr service
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(
    mobileUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-right shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl">
              📱
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-base sm:text-lg">
                اختبار تطبيق كرمالك على الموبايل
              </h3>
              <p className="text-xs text-slate-500">نسخة تجريبية حية وسريعة لأجهزة الهاتف</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>

        {/* QR Code Section */}
        <div className="text-center my-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-slate-200 mb-2">
            <img
              src={qrCodeImageUrl}
              alt="QR Code لفتح التطبيق على الموبايل"
              className="w-44 h-44 mx-auto rounded-lg object-contain"
            />
          </div>
          <p className="text-xs font-bold text-slate-700">
            📷 وجّه كاميرا هاتفك نحو الرمز لمسحه وفتح التطبيق فوراً
          </p>
        </div>

        {/* Link & Copy */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <input
              type="text"
              readOnly
              value={mobileUrl}
              className="flex-1 bg-transparent text-xs text-slate-600 font-mono focus:outline-none px-2 text-left"
              dir="ltr"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
            >
              {copied ? 'تم النسخ! ✓' : 'نسخ الرابط'}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSendToWhatsApp}
            className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <span>💬</span>
            <span>إرسال الرابط لنفسك عبر واتساب لفتحه بالموبايل</span>
          </button>
        </div>

        {/* PWA Install Instructions */}
        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-2">
          <h4 className="font-black text-emerald-900 flex items-center gap-1.5">
            <span>📲</span>
            <span>تثبيت كرمالك كتطبيق على شاشة هاتفك:</span>
          </h4>
          <div className="text-[11px] leading-relaxed space-y-1 text-slate-600">
            <p>
              • <strong>على أجهزة Android:</strong> اضغط على القائمة (⋮) ثم اختر{' '}
              <span className="font-bold text-emerald-800">"تثبيت التطبيق"</span> أو{' '}
              <span className="font-bold text-emerald-800">"إضافة إلى الشاشة الرئيسية"</span>.
            </p>
            <p>
              • <strong>على أجهزة iPhone (Safari):</strong> اضغط على زر المشاركة (Share) بالأسفل ثم{' '}
              <span className="font-bold text-emerald-800">"Add to Home Screen / إضافة للشاشة الرئيسية"</span>.
            </p>
          </div>
        </div>

        {/* Native Install Button if browser supports beforeinstallprompt */}
        {isInstallable && (
          <button
            type="button"
            onClick={install}
            className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
          >
            تثبيت التطبيق على هذا الجهاز الآن 🚀
          </button>
        )}
      </div>
    </div>
  );
}
