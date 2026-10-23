import React, { useState } from 'react';
import {
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
} from './supabaseClient.ts';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupabaseSettingsModal({ isOpen, onClose }: SupabaseSettingsModalProps) {
  const [url, setUrl] = useState(
    supabaseUrl.includes('placeholder-project') ? '' : supabaseUrl
  );
  const [key, setKey] = useState(
    supabaseAnonKey.includes('placeholder-anon') ? '' : supabaseAnonKey
  );
  const configured = isSupabaseConfigured();

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      alert('يرجى إدخال رابط المشروع والمفتاح العام Anon Key.');
      return;
    }
    saveSupabaseCredentials(url, key);
  };

  const handleReset = () => {
    if (window.confirm('هل تريد مسح مفاتيح Supabase والعودة إلى التخزين المحلي التجريبي؟')) {
      clearSupabaseCredentials();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-right shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <h3 className="font-black text-slate-800 text-lg">إعدادات ربط Supabase</h3>
              <p className="text-xs text-slate-500">ربط مباشر مع قاعدة بيانات ومصادقة Supabase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              configured
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <span>{configured ? '✅' : '⚠️'}</span>
            <span>
              {configured
                ? 'مشروع Supabase مربوط ويعمل حالياً!'
                : 'المشروع يعمل حالياً بالوضع المحلي التجريبي (Local Demo Cache). يمكنك لصق بيانات Supabase لربطه فوراً.'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Project URL (رابط المشروع من Supabase)
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxxxx.supabase.co"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Anon Public Key (المفتاح العام)
            </label>
            <textarea
              rows={3}
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
              dir="ltr"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg text-[11px] text-slate-500 leading-relaxed">
            📌 <strong>الجداول المستخدمة في كرمالك:</strong>
            <ul className="list-disc list-inside mt-1 text-slate-600">
              <li><code>shops</code>: (id, name, category, phone, address, description, is_active, user_id)</li>
              <li><code>products</code>: (id, shop_id, name, image_url, price, description)</li>
              <li><code>shop_requests</code>: (id, name, category, phone, address, description, email, status, user_id)</li>
              <li><code>admin_users</code>: (user_id)</li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {configured && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-bold text-red-600 hover:text-red-700 underline"
              >
                مسح البيانات والعودة للوضع المحلي
              </button>
            )}
            <div className="flex gap-2 mr-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                إغلاق
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
              >
                حفظ وإعادة الاتصال
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
