'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('admin@amarah.local');
  const [password, setPassword] = useState('Admin@123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personas = [
    {
      role: 'مدير النظام',
      email: 'admin@amarah.local',
      desc: 'إشراف كامل على النظام والصلاحيات والمستخدمين',
      tag: 'ADMIN',
      color: 'border-purple-200 bg-purple-50 text-purple-700',
    },
    {
      role: 'مدير الأملاك',
      email: 'manager@amarah.local',
      desc: 'إدارة العقارات والوحدات والمستأجرين والعقود',
      tag: 'MANAGER',
      color: 'border-teal-200 bg-teal-50 text-teal-700',
    },
    {
      role: 'المحاسب المالي',
      email: 'accountant@amarah.local',
      desc: 'التحصيلات، السندات، المصروفات والتقارير المالية',
      tag: 'ACCOUNTANT',
      color: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    {
      role: 'مسؤول الصيانة',
      email: 'maintenance@amarah.local',
      desc: 'إدارة البلاغات وأوامر العمل وتكليف الفنيين',
      tag: 'MAINTENANCE',
      color: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    {
      role: 'مالك عقار',
      email: 'owner@amarah.local',
      desc: 'متابعة أداء العقارات، نسب الإشغال والتسويات',
      tag: 'OWNER',
      color: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    {
      role: 'المستأجر',
      email: 'tenant@amarah.local',
      desc: 'الاطلاع على العقود والمدفوعات وبلاغات الصيانة',
      tag: 'TENANT',
      color: 'border-slate-200 bg-slate-50 text-slate-700',
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'فشل تسجيل الدخول');
        return;
      }

      const userRoles: string[] = data.user?.roles || [];
      const isAdmin = userRoles.includes('ADMIN');

      if (userRoles.includes('TENANT') && !isAdmin) {
        window.location.href = '/portal/tenant';
      } else if (userRoles.includes('OWNER') && !isAdmin) {
        window.location.href = '/portal/owner';
      } else {
        window.location.href = '/dashboard';
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersona = (email: string) => {
    setIdentifier(email);
    setPassword('Admin@123456');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-white font-black text-3xl shadow-xl shadow-teal-500/20 mb-4 ring-4 ring-teal-500/10">
          ع
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          عِمارة | A'marah
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
          نظام متكامل لإدارة العقارات والأملاك والعمليات المالية والتشغيلية
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white text-slate-900 py-8 px-5 sm:px-8 shadow-2xl rounded-3xl border border-slate-200/80">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3 text-rose-700 animate-fade-in text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="font-semibold">{error}</div>
              </div>
            )}

            <div>
              <label
                htmlFor="identifier"
                className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5"
              >
                البريد الإلكتروني أو اسم المستخدم
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pr-11 pl-3 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-colors bg-slate-50/50 hover:bg-white"
                  placeholder="admin@amarah.local"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5"
              >
                كلمة المرور
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pr-11 pl-3 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-colors bg-slate-50/50 hover:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                اتصال آمن ومصادقة مشفرة
              </span>
              <span className="text-teal-700 font-semibold cursor-default">
                كلمة المرور التجريبية: Admin@123456
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-150 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <span>جاري التحقق من الصلاحيات...</span>
              ) : (
                <>
                  <span>تسجيل الدخول للمنظومة</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Persona Selection for Rapid Testing */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                اختيار سريع لدور مستخدم (للاختبار الفعلي):
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {personas.map((p) => {
                const isSelected = identifier === p.email;
                return (
                  <button
                    key={p.email}
                    type="button"
                    onClick={() => handleSelectPersona(p.email)}
                    className={`text-right p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600 text-teal-900 font-bold'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-slate-900">{p.role}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block w-full">
                      {p.email}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-400">
          نظام عِمارة &copy; 2026 — منصة إدارة الأملاك والأصول العقارية
        </div>
      </div>
    </div>
  );
}
