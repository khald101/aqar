'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Key,
  Layers,
  RefreshCw,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleBadge } from '@/components/ui/Badge';

interface RoleWithPermissions {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  description: string | null;
  usersCount: number;
  permissions: {
    id: string;
    code: string;
    module: string;
    nameAr: string;
    description: string | null;
  }[];
}

interface PermissionItem {
  id: string;
  code: string;
  module: string;
  nameAr: string;
  description: string | null;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [updatingPermId, setUpdatingPermId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setUnauthorized(false);

      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          const perms = meData.user?.permissions || [];
          const userRoles = meData.user?.roles || [];
          setCanManage(userRoles.includes('ADMIN') || perms.includes('roles:manage'));
        }
      } catch (e) {
        console.error('Failed to load user permissions:', e);
      }

      const res = await fetch('/api/roles');
      if (res.status === 403) {
        setUnauthorized(true);
      } else if (res.ok) {
        const data = await res.json();
        const loadedRoles: RoleWithPermissions[] = data.roles || [];
        setRoles(loadedRoles);
        setAllPermissions(data.allPermissions || []);
        if (loadedRoles.length > 0 && !selectedRoleId) {
          setSelectedRoleId(loadedRoles[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const activeRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const handleTogglePermission = async (perm: PermissionItem, isCurrentlyGranted: boolean) => {
    if (!canManage || !activeRole || activeRole.code === 'ADMIN') return;

    setUpdatingPermId(perm.id);
    const action = isCurrentlyGranted ? 'revoke' : 'grant';

    // Optimistic UI Update
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== activeRole.id) return r;
        const newPerms = isCurrentlyGranted
          ? r.permissions.filter((p) => p.code !== perm.code)
          : [...r.permissions, perm];
        return { ...r, permissions: newPerms };
      })
    );

    try {
      const res = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: activeRole.id,
          permissionId: perm.id,
          action,
        }),
      });

      if (!res.ok) {
        loadRoles();
      } else {
        setFeedbackMsg(
          action === 'grant'
            ? `تم منح صلاحية [${perm.nameAr}] للدور [${activeRole.nameAr}] بنجاح`
            : `تم سحب صلاحية [${perm.nameAr}] من الدور [${activeRole.nameAr}] بنجاح`
        );
        setTimeout(() => setFeedbackMsg(null), 3500);
      }
    } catch {
      loadRoles();
    } finally {
      setUpdatingPermId(null);
    }
  };

  // Group all permissions by module
  const modulesMap = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {} as Record<string, PermissionItem[]>);

  const moduleTitles: Record<string, string> = {
    USERS: 'المستخدمون والحسابات',
    ROLES: 'الأدوار ومصفوفة الصلاحيات',
    PROPERTIES: 'الأصول والعقارات',
    UNITS: 'الوحدات العقارية',
    OWNERS: 'إدارة الملاك والتسويات',
    TENANTS: 'المستأجرون وسجلاتهم',
    CONTRACTS: 'عقود الإيجار والبنود',
    FINANCIAL: 'المحاسبة والتحصيلات والمصروفات',
    MAINTENANCE: 'الصيانة وأوامر العمل',
    AUDIT: 'سجل التدقيق والرقابة',
    REPORTS: 'التقارير والإحصاءات',
    AI: 'مستشار الذكاء الاصطناعي',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-600" />
              مصفوفة الأدوار والصلاحيات الدقيقة (RBAC)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              صلاحيات صارمة ومفروضة على مستوى الخادم تحمي كل استعلام وعملية مالية وإدارية
            </p>
          </div>

          {canManage && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-200">
              <ShieldCheck className="w-4 h-4" />
              <span>إدارة وتعديل الصلاحيات الفورية مفعلة</span>
            </div>
          )}
        </div>

        {feedbackMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-2xl text-xs sm:text-sm font-bold border border-emerald-200 flex items-center gap-2 transition-all">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {unauthorized ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ليس لديك صلاحية استعراض مصفوفة الأدوار</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              حسابك الحالي لا يمتلك الصلاحية المطلوبة (roles:view). هذا القسم مخصص لمدير النظام فقط.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              <span>العودة للوحة التحكم</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Roles Horizontal/Vertical Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              {roles.map((r) => {
                const isSelected = activeRole?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/70 shadow-sm ring-1 ring-purple-600'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 block truncate">
                          {r.nameAr}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {r.code}
                      </span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{r.code === 'ADMIN' ? allPermissions.length : r.permissions.length} صلاحية</span>
                      <span className="font-semibold text-purple-700">{r.usersCount} مستخدم</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Role Deep-Dive Card */}
            {activeRole && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-100 gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <RoleBadge roleCode={activeRole.code} />
                      <h2 className="text-lg font-bold text-slate-900">
                        {activeRole.nameAr} ({activeRole.nameEn})
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
                      {activeRole.description || 'لا يوجد وصف متاح'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                      <Key className="w-4 h-4 text-purple-600" />
                      <span>
                        الصلاحيات الممنوحة: {activeRole.code === 'ADMIN' ? allPermissions.length : activeRole.permissions.length} من أصل {allPermissions.length}
                      </span>
                    </div>
                  </div>
                </div>

                {canManage && activeRole.code !== 'ADMIN' && (
                  <div className="p-3 bg-purple-50/70 border border-purple-200/60 rounded-xl text-xs text-purple-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>
                      يمكنك النقر مباشرة على أي صلاحية أدناه لتفعيلها أو تعطيلها لهذا الدور فورياً وتحديث قاعدة البيانات.
                    </span>
                  </div>
                )}

                {/* Permissions Grouped by Module */}
                <div className="space-y-6">
                  {Object.entries(modulesMap).map(([moduleKey, modulePerms]) => {
                    const assignedCount = modulePerms.filter((p) =>
                      activeRole.code === 'ADMIN' || activeRole.permissions.some((rp) => rp.code === p.code)
                    ).length;

                    return (
                      <div key={moduleKey} className="rounded-2xl border border-slate-200/80 overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-200/80">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-slate-500" />
                            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
                              {moduleTitles[moduleKey] || moduleKey}
                            </h3>
                            <span className="text-[11px] font-mono text-slate-400">({moduleKey})</span>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                            {assignedCount} / {modulePerms.length}
                          </span>
                        </div>

                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white">
                          {modulePerms.map((perm) => {
                            const isGranted =
                              activeRole.code === 'ADMIN' ||
                              activeRole.permissions.some((rp) => rp.code === perm.code);
                            const isUpdating = updatingPermId === perm.id;
                            const isClickable = canManage && activeRole.code !== 'ADMIN';

                            return (
                              <button
                                key={perm.id}
                                type="button"
                                disabled={!isClickable || isUpdating}
                                onClick={() => handleTogglePermission(perm, isGranted)}
                                className={`p-3 rounded-xl border text-right transition-all flex items-start justify-between gap-2.5 ${
                                  isGranted
                                    ? 'border-emerald-200 bg-emerald-50/40 text-slate-900'
                                    : 'border-slate-100 bg-slate-50/50 text-slate-400 opacity-60'
                                } ${
                                  isClickable
                                    ? 'hover:shadow-xs hover:border-purple-300 cursor-pointer active:scale-[0.99]'
                                    : 'cursor-default'
                                }`}
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  {isUpdating ? (
                                    <RefreshCw className="w-4 h-4 text-purple-600 animate-spin shrink-0 mt-0.5" />
                                  ) : isGranted ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                                  )}
                                  <div className="min-w-0">
                                    <span className="block text-xs font-bold truncate">
                                      {perm.nameAr}
                                    </span>
                                    <span className="block text-[11px] font-mono text-slate-500">
                                      {perm.code}
                                    </span>
                                    {perm.description && (
                                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                                        {perm.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {isClickable && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md mt-0.5 shrink-0 transition-colors bg-white border border-slate-200 text-slate-600">
                                    {isGranted ? 'مفعلة' : 'معطلة'}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
