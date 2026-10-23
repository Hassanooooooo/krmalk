import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient.ts';

interface CustomerAuthProps {
  onSuccess: () => void;
}

export default function CustomerAuth({ onSuccess }: CustomerAuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    try {
      if (isSupabaseConfigured()) {
        if (mode === 'login') {
          const { error } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });
          if (error) throw error;
          setMsg({ text: 'تم تسجيل الدخول بنجاح!', type: 'success' });
          setTimeout(() => onSuccess(), 400);
        } else {
          const { data, error } = await supabase.auth.signUp({
            email: cleanEmail,
            password,
            options: {
              data: {
                full_name: fullName.trim(),
                phone: phone.trim(),
              },
            },
          });
          if (error) throw error;
          if (data.session) {
            setMsg({ text: 'تم إنشاء الحساب وتسجيل الدخول بنجاح!', type: 'success' });
            setTimeout(() => onSuccess(), 400);
          } else {
            setMsg({
              text: 'تم إنشاء الحساب بنجاح! إذا كانت رسائل التأكيد مفعّلة في Supabase، يرجى مراجعة بريدك.',
              type: 'success',
            });
            setTimeout(() => onSuccess(), 1200);
          }
        }
      } else {
        // Fallback local auth simulation
        const fakeUser = {
          id: 'user-' + Date.now(),
          email: cleanEmail,
          user_metadata: {
            full_name: fullName || cleanEmail.split('@')[0],
            phone: phone || '',
          },
        };
        localStorage.setItem('karmalak-customer-user', JSON.stringify(fakeUser));
        setMsg({ text: 'أهلاً بك في كرمالك!', type: 'success' });
        setTimeout(() => onSuccess(), 300);
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'حدث خطأ أثناء المحاولة';
      setMsg({ text: errMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = () => {
    localStorage.setItem(
      'karmalak-customer-user',
      JSON.stringify({
        id: 'guest-' + Date.now(),
        email: 'guest@wafideen.local',
        user_metadata: { full_name: 'زائر مخيم الوافدين' },
      })
    );
    onSuccess();
  };

  return (
    <div className="max-w-md mx-auto my-6 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 text-right">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <img
          src="/src/assets/images/karmalak_app_logo_1792756141616.jpg"
          alt="شعار كرمالك"
          className="w-20 h-20 mx-auto rounded-2xl shadow-md object-cover mb-3 border border-emerald-100"
          referrerPolicy="no-referrer"
        />
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">كرمالك - مخيم الوافدين</h1>
        <p className="text-sm text-slate-500 mt-1">دليلك وسوقك المحلي الأقرب إليك</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setMsg(null);
          }}
          className={`flex-1 py-2.5 text-center font-bold text-sm transition-all border-b-2 ${
            mode === 'login'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          تسجيل الدخول
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setMsg(null);
          }}
          className={`flex-1 py-2.5 text-center font-bold text-sm transition-all border-b-2 ${
            mode === 'register'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          حساب جديد
        </button>
      </div>

      {msg && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm font-medium border ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}
        >
          {msg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {mode === 'register' && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: أحمد المحمد"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف (للتوصيل والتواصل)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني *</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور *</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-sm shadow-sm disabled:opacity-50"
        >
          {loading
            ? 'جارٍ التحميل...'
            : mode === 'login'
            ? 'دخول إلى كرمالك'
            : 'إنشاء حساب الزبون'}
        </button>
      </form>

      {/* Guest bypass */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={handleGuestEntry}
          className="text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:underline py-1"
        >
          🚶‍♂️ التصفح كزائر بدون تسجيل الآن
        </button>
      </div>
    </div>
  );
}
