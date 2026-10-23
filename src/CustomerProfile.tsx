import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient.ts';

export default function CustomerProfile() {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: 'مخيم الوافدين - الشارع العام',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      if (isSupabaseConfigured()) {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (user) {
          const meta = user.user_metadata || {};
          setProfile({
            name: meta.full_name || user.email?.split('@')[0] || '',
            email: user.email || '',
            phone: meta.phone || '',
            address: meta.address || 'مخيم الوافدين',
            notes: meta.notes || '',
          });
          return;
        }
      }

      // Fallback local storage
      const localUserStr = localStorage.getItem('karmalak-customer-user');
      if (localUserStr) {
        const u = JSON.parse(localUserStr);
        setProfile({
          name: u.user_metadata?.full_name || 'زبون كرمالك',
          email: u.email || 'customer@wafideen.local',
          phone: u.user_metadata?.phone || '',
          address: u.user_metadata?.address || 'مخيم الوافدين',
          notes: u.user_metadata?.notes || '',
        });
      } else {
        setProfile({
          name: 'زبون كرمالك',
          email: 'customer@wafideen.local',
          phone: '0987654321',
          address: 'مخيم الوافدين - جانب المركز الصحي',
          notes: '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSavedMsg('');

    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.updateUser({
          data: {
            full_name: profile.name,
            phone: profile.phone,
            address: profile.address,
            notes: profile.notes,
          },
        });
        if (error) throw error;
      }

      // Always save to localStorage as cache
      const localUser = {
        email: profile.email,
        user_metadata: {
          full_name: profile.name,
          phone: profile.phone,
          address: profile.address,
          notes: profile.notes,
        },
      };
      localStorage.setItem('karmalak-customer-user', JSON.stringify(localUser));

      setSavedMsg('تم حفظ وتحديث بيانات الملف الشخصي بنجاح!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'تعذّر الحفظ';
      setSavedMsg('خطأ: ' + msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto my-4 text-right">
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl font-black">
            👤
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">{profile.name || 'الملف الشخصي'}</h1>
            <p className="text-xs text-slate-500">{profile.email}</p>
            <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
              📍 ساكن في مخيم الوافدين
            </span>
          </div>
        </div>

        {savedMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg">
            {savedMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف للتواصل والطلبات *</label>
              <input
                type="tel"
                required
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="09xxxxxxxx"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                العنوان التفصيلي في مخيم الوافدين *
              </label>
              <input
                type="text"
                required
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="الحارة / الشارع / أقرب دكان أو معلم"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات إضافية للتوصيل (اختياري)
            </label>
            <textarea
              rows={2}
              value={profile.notes}
              onChange={(e) => setProfile({ ...profile, notes: e.target.value })}
              placeholder="مثال: الاتصال قبل الوصول / التوصيل بعد العصر..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-sm transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
            </button>
          </div>
        </form>

        {/* Quick Tips */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 mb-2">💡 ميزات تطبيق كرمالك:</h4>
          <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
            <li>التواصل المباشر مع محلات مخيم الوافدين هاتفياً أو عبر واتساب بنقرة واحدة.</li>
            <li>الاطلاع على أحدث الأسعار والعروض اليومية دون وسيط.</li>
            <li>إمكانية تقديم طلب لأي محل جديد ترغب في انضمامه للدليل.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
