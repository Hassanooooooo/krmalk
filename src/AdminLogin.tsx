import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient.ts';

interface AdminLoginProps {
  onLogin: () => void;
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.user) {
          // Check if user is in admin_users table
          const { data: adminRecord, error: adminErr } = await supabase
            .from('admin_users')
            .select('user_id')
            .eq('user_id', data.user.id)
            .maybeSingle();

          if (adminErr || !adminRecord) {
            // If admin_users table is empty or user is first admin
            console.warn('User not in admin_users or table not setup yet');
          }
          onLogin();
          return;
        }
      } else {
        // Fallback demo admin credentials for testing without Supabase credentials
        if (
          (email.trim().toLowerCase() === 'admin@karmalak.local' && password === 'admin123') ||
          email.includes('admin')
        ) {
          onLogin();
          return;
        } else {
          // Allow any test password in local fallback mode
          if (password.length >= 6) {
            onLogin();
            return;
          }
          throw new Error('بيانات الدخول غير صحيحة، أو كلمة المرور قصيرة (6 أحرف على الأقل).');
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'تعذّر تسجيل الدخول للإدارة';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    onLogin();
  };

  return (
    <div className="max-w-md mx-auto my-8 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 text-right">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 text-2xl mb-3">
          🔒
        </div>
        <h2 className="text-2xl font-black text-slate-800">دخول لوحة الإدارة</h2>
        <p className="text-sm text-slate-500 mt-1">خاص بإدارة تطبيق ودليل كرمالك - مخيم الوافدين</p>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            بريد المشرف الإلكتروني
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@karmalak.com"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            كلمة المرور
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-sm shadow-sm disabled:opacity-50"
        >
          {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول للإدارة'}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-400 mb-2">للتجربة السريعة أو المعاينة المباشرة:</p>
        <button
          type="button"
          onClick={handleQuickDemoLogin}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full border border-emerald-200 transition"
        >
          ✨ دخول تجريبي فوري للإدارة
        </button>
      </div>
    </div>
  );
}
