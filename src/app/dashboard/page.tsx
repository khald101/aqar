'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Home,
  Users,
  ShieldCheck,
  ClipboardList,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  FileCheck,
  FileText,
  CreditCard,
  Wallet,
  Wrench,
  Sparkles,
  Building,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { RoleBadge } from '@/components/ui/Badge';

interface DashboardStats {
  usersCount: number;
  rolesCount: number;
  propertiesCount: number;
  unitsCount: number;
  rentedUnitsCount: number;
  vacantUnitsCount: number;
  occupancyRate: number;
  contractsCount: number;
  paymentsCount: number;
  maintenanceCount: number;
  auditLogsCount: number;
}

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  userEmail: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [hasAuditView, setHasAuditView] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!isMounted) return;

        if (meRes.ok) {
          const meData = await meRes.json();
          const user = meData.user;
          if (isMounted) setCurrentUser(user);

          const roles: string[] = user?.roles || [];
          if (roles.includes('TENANT') && !roles.includes('ADMIN')) {
            router.replace('/portal/tenant');
            return;
          }
          if (roles.includes('OWNER') && !roles.includes('ADMIN')) {
            router.replace('/portal/owner');
            return;
          }
        }

        const res = await fetch('/api/stats');
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStats(data.stats);
            setRecentActivity(data.recentActivity || []);
            setHasAuditView(!!data.permissions?.canViewAudit);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const isAdmin = currentUser?.roles?.includes('ADMIN');
  const userPerms = currentUser?.permissions || [];

  const canAccess = (perms: string[]) => {
    if (isAdmin) return true;
    return perms.some((p) => userPerms.includes(p));
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">دخول</span>;
      case 'LOGOUT':
        return <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">خروج</span>;
      case 'CREATE':
        return <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">إنشاء</span>;
      case 'UPDATE':
        return <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">تعديل</span>;
      case 'PAYMENT':
        return <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">سند قبض</span>;
      case 'OPEN':
      case 'PENDING':
        return <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">قيد الانتظار</span>;
      case 'IN_PROGRESS':
        return <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">جاري التنفيذ</span>;
      case 'RESOLVED':
        return <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">مكتمل</span>;
      default:
        return <span className="text-[11px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">{action}</span>;
    }
  };

  // Quick Action items strictly filtered by permissions
  const allQuickActions = [
    {
      title: 'العقارات والوحدات',
      desc: 'استعراض الأصول والوحدات والمساحات',
      href: '/properties',
      icon: Building2,
      color: 'teal',
      permissions: ['properties:view'],
    },
    {
      title: 'عقود الإيجار والتحصيلات',
      desc: 'جداول الاستحقاق وإشغال الوحدات',
      href: '/contracts',
      icon: FileText,
      color: 'emerald',
      permissions: ['contracts:view'],
    },
    {
      title: 'التحصيلات وسندات القبض',
      desc: 'تسجيل التحصيلات وإصدار السندات',
      href: '/payments',
      icon: CreditCard,
      color: 'blue',
      permissions: ['financial:payments', 'financial:view'],
    },
    {
      title: 'المحاسبة والقيود المزدوجة',
      desc: 'القيود، دليل الحسابات والمصروفات',
      href: '/accounting',
      icon: Wallet,
      color: 'indigo',
      permissions: ['financial:journal', 'financial:expenses', 'owners:settlements'],
    },
    {
      title: 'أوامر وبلاغات الصيانة',
      desc: 'إسناد وتوجيه ومتابعة أعمال الإصلاح',
      href: '/maintenance',
      icon: Wrench,
      color: 'amber',
      permissions: ['maintenance:view'],
    },
    {
      title: 'ملفات الملاك والتسويات',
      desc: 'استعراض نسب الملكية وحساب الأرباح',
      href: '/owners',
      icon: Building,
      color: 'rose',
      permissions: ['owners:view'],
    },
    {
      title: 'سجلات المستأجرين',
      desc: 'ملفات المستأجرين والعقود السارية',
      href: '/tenants',
      icon: KeyRound,
      color: 'teal',
      permissions: ['tenants:view'],
    },
    {
      title: 'مستشار الذكاء الاصطناعي',
      desc: 'تحليل الأداء المالي ومحاكاة العوائد',
      href: '/ai-advisor',
      icon: Sparkles,
      color: 'purple',
      permissions: ['ai:insights'],
    },
    {
      title: 'المستخدمون والحسابات',
      desc: 'إدارة حسابات فريق العمل والأدوار',
      href: '/users',
      icon: Users,
      color: 'cyan',
      permissions: ['users:view'],
    },
    {
      title: 'مصفوفة الأدوار والصلاحيات (RBAC)',
      desc: 'إدارة ومنح الصلاحيات الدقيقة للنظام',
      href: '/roles',
      icon: ShieldCheck,
      color: 'purple',
      permissions: ['roles:view', 'roles:manage'],
    },
    {
      title: 'سجل التدقيق والرقابة',
      desc: 'توثيق الحركات ومسار الأمان الشامل',
      href: '/audit-logs',
      icon: ClipboardList,
      color: 'slate',
      permissions: ['audit:view'],
    },
  ];

  const quickActions = allQuickActions.filter((qa) => canAccess(qa.permissions));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3 border border-teal-500/30">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
              <span>نظام الأمان والصلاحيات المخصص</span>
              {currentUser && (
                <span className="text-white/80 font-mono">({currentUser.roles[0] || 'USER'})</span>
              )}
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              أهلاً بك، {currentUser?.fullName || 'في نظام عِمارة'}
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              تم تخصيص واجهة النظام لتعرض حصراً الأقسام والعمليات المندرجة تحت نطاق صلاحيات حسابك.
            </p>
          </div>
          <div className="absolute left-0 bottom-0 translate-y-1/3 -translate-x-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Live KPI Metric Cards - Adapted to user's permissions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {canAccess(['properties:view']) && (
            <StatCard
              title="إجمالي الأصول العقارية"
              value={stats ? `${stats.propertiesCount} عقار` : '...'}
              subtitle="المباني والأصول المسجلة"
              icon={Building2}
              color="teal"
            />
          )}

          {canAccess(['units:view', 'properties:view']) && (
            <StatCard
              title="الوحدات العقارية"
              value={stats ? `${stats.unitsCount} وحدة` : '...'}
              subtitle={stats ? `${stats.rentedUnitsCount} مؤجرة • ${stats.vacantUnitsCount} شاغرة` : '...'}
              icon={Home}
              color="blue"
            />
          )}

          {canAccess(['contracts:view', 'properties:view']) && (
            <StatCard
              title="نسبة الإشغال الإجمالية"
              value={stats ? `${stats.occupancyRate}%` : '...'}
              subtitle="معدل إشغال المحفظة الحالية"
              icon={Activity}
              color="emerald"
              trend={stats ? { value: `محسوبة فعلياً`, isPositive: stats.occupancyRate > 0 } : undefined}
            />
          )}

          {/* Show Financial KPI if has financial permission */}
          {canAccess(['financial:view', 'financial:payments']) && !canAccess(['users:view']) && (
            <StatCard
              title="التحصيلات والمدفوعات"
              value={stats ? `${stats.paymentsCount} حركة` : '...'}
              subtitle="سندات القبض المسجلة بالنظام"
              icon={CreditCard}
              color="blue"
            />
          )}

          {/* Show Maintenance KPI if has maintenance permission */}
          {canAccess(['maintenance:view']) && !canAccess(['properties:view']) && (
            <StatCard
              title="بلاغات الصيانة"
              value={stats ? `${stats.maintenanceCount} بلاغ` : '...'}
              subtitle="أوامر العمل والطلبات الميدانية"
              icon={Wrench}
              color="amber"
            />
          )}

          {/* Show Users KPI if has user management permission */}
          {canAccess(['users:view']) && (
            <StatCard
              title="المستخدمون والصلاحيات"
              value={stats ? `${stats.usersCount} مستخدم` : '...'}
              subtitle={stats ? `${stats.rolesCount} أدوار معتمدة بالنظام` : '...'}
              icon={Users}
              color="purple"
            />
          )}
        </div>

        {/* Dynamic Quick Actions & Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions List */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-teal-600" />
                <span>الوصول السريع للأقسام المعتمدة</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-bold border border-teal-200">
                  {quickActions.length} قسم
                </span>
              </h2>

              {quickActions.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  لا توجد أقسام مسندة لحسابك حالياً
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.href}
                        href={action.href}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/30 transition-all text-xs sm:text-sm font-semibold text-slate-800 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-slate-50 text-slate-700 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate text-slate-900 font-bold">{action.title}</span>
                            <span className="block truncate text-[11px] text-slate-400">{action.desc}</span>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 rotate-180 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Current Session Security Badge */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                بيانات الجلسة والصلاحيات
              </h2>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">نوع المستخدم / الدور:</span>
                  <RoleBadge roleCode={currentUser?.roles?.[0] || 'ADMIN'} />
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">عدد الصلاحيات الممنوحة:</span>
                  <span className="font-bold text-slate-900">
                    {isAdmin ? 'كامل الصلاحيات (باي باس)' : `${userPerms.length} صلاحية`}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">حالة التحقق والحماية:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    مفروضة على مستوى الخادم
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity Table (Audit Log if permitted, or Operational Activity) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-teal-600" />
                    {hasAuditView ? 'أحدث حركات سجل التدقيق والرقابة' : 'أحدث العمليات والأنشطة المسجلة'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {hasAuditView
                      ? 'توثيق لكافة حركات تسجيل الدخول والإنشاء وتعديل الصلاحيات'
                      : 'سجل مباشر بالعمليات التشغيلية التابعة لنطاق تخصصك'}
                  </p>
                </div>
                {hasAuditView && (
                  <Link
                    href="/audit-logs"
                    className="text-xs font-bold text-teal-600 hover:text-teal-700"
                  >
                    عرض السجل كاملاً &larr;
                  </Link>
                )}
              </div>

              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  جاري تحميل السجل...
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  لا توجد حركات مسجلة حالياً
                </div>
              ) : (
                <div className="table-responsive-container">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                        <th className="py-2.5 px-3">النوع / الحالة</th>
                        <th className="py-2.5 px-3">البيان / الكيان</th>
                        <th className="py-2.5 px-3">المصدر</th>
                        <th className="py-2.5 px-3">التاريخ والوقت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentActivity.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap">
                            {getActionBadge(log.action)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-800">
                            {log.entity}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                            {log.userEmail || 'نظام آلي'}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                            {new Date(log.createdAt).toLocaleString('ar-SA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>يتم إخفاء أي قسم أو سجل غير مصرح به تلقائياً</span>
              <span className="font-semibold text-teal-700">نظام الصلاحيات فعال 100%</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
