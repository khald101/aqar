'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  LogOut,
  UserCheck,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { RoleBadge } from '../ui/Badge';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentUser: {
    userId: string;
    fullName: string;
    email: string;
    roles: string[];
    permissions: string[];
  } | null;
}

export function Header({ onToggleSidebar, currentUser }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const personas = [
    { email: 'admin@amarah.local', name: 'عبدالله السعدون', role: 'ADMIN', label: 'مدير النظام' },
    { email: 'manager@amarah.local', name: 'فهد المطيري', role: 'PROPERTY_MANAGER', label: 'مدير الأملاك' },
    { email: 'accountant@amarah.local', name: 'سارة القحطاني', role: 'ACCOUNTANT', label: 'المحاسب' },
    { email: 'maintenance@amarah.local', name: 'سلطان الدوسري', role: 'MAINTENANCE_SUPERVISOR', label: 'مسؤول الصيانة' },
    { email: 'tech@amarah.local', name: 'خالد الزهراني', role: 'TECHNICIAN', label: 'فني ميداني' },
    { email: 'owner@amarah.local', name: 'محمد بن راشد', role: 'OWNER', label: 'المالك' },
    { email: 'tenant@amarah.local', name: 'عمر التميمي', role: 'TENANT', label: 'المستأجر' },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleQuickSwitch = async (email: string) => {
    try {
      setIsSwitchingRole(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password: 'Admin@123456' }),
      });

      if (res.ok) {
        if (email === 'tenant@amarah.local') {
          window.location.href = '/portal/tenant';
        } else if (email === 'owner@amarah.local') {
          window.location.href = '/portal/owner';
        } else if (email === 'tech@amarah.local') {
          window.location.href = '/maintenance';
        } else if (email === 'maintenance@amarah.local') {
          window.location.href = '/maintenance';
        } else if (email === 'accountant@amarah.local') {
          window.location.href = '/accounting';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err) {
      console.error('Quick switch error:', err);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left side (in RTL: Right side): Toggle button & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors shrink-0"
          aria-label="تبديل القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
            نظام عِمارة <span className="hidden sm:inline">لإدارة العقارات والأملاك</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500 truncate hidden min-[360px]:block">
            البوابة الإدارية المركزية
          </p>
        </div>
      </div>

      {/* Right side (in RTL: Left side): Persona switch, Role badge, User, Logout */}
      <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
        {/* Quick Role Switcher Dropdown for Testing */}
        <div className="relative group">
          <button
            type="button"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            title="اختبار أدوار وصلاحيات النظام المختلفة"
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span className="hidden sm:inline">تبديل المستخدم للاختبار</span>
            <span className="inline sm:hidden text-[10px] font-bold">الدور</span>
            {isSwitchingRole && <RefreshCw className="w-3 h-3 animate-spin text-teal-600" />}
          </button>

          {/* Persona Menu on Hover/Click */}
          <div className="absolute left-0 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 hidden group-hover:block z-50 animate-fade-in">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
              اختر دورًا لاختبار الصلاحيات الحقيقية:
            </div>
            {personas.map((p) => {
              const isActive = currentUser?.email === p.email;
              return (
                <button
                  key={p.email}
                  disabled={isSwitchingRole || isActive}
                  onClick={() => handleQuickSwitch(p.email)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-right transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-800 font-bold border border-teal-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <span className="block font-medium">{p.name}</span>
                    <span className="text-[10px] text-slate-400">{p.label}</span>
                  </div>
                  <RoleBadge roleCode={p.role} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Active User & Role */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
            <div className="hidden sm:block text-left">
              <span className="block text-xs font-bold text-slate-900 leading-tight">
                {currentUser.fullName}
              </span>
              <div className="mt-0.5">
                <RoleBadge roleCode={currentUser.roles[0] || 'ADMIN'} />
              </div>
            </div>
          </div>
        )}

        {/* Notifications Icon (Mock indicator) */}
        <button
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl relative transition-colors"
          aria-label="الإشعارات"
          title="الإشعارات الداخلية"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-teal-500 absolute top-1.5 right-1.5 ring-2 ring-white" />
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 flex items-center gap-1.5 text-xs font-bold"
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">خروج</span>
        </button>
      </div>
    </header>
  );
}
