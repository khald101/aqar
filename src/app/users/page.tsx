'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { RoleBadge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface UserRecord {
  id: string;
  email: string;
  username: string | null;
  fullName: string;
  phone: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  roles: {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
  }[];
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('User@123456');
  const [roleCode, setRoleCode] = useState('PROPERTY_MANAGER');
  const [status, setStatus] = useState('ACTIVE');
  const [unauthorized, setUnauthorized] = useState(false);
  const [canCreateUser, setCanCreateUser] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setUnauthorized(false);

      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          const perms: string[] = meData.user?.permissions || [];
          const roles: string[] = meData.user?.roles || [];
          const isAdmin = roles.includes('ADMIN');
          setCanCreateUser(isAdmin || perms.includes('users:create'));
        }
      } catch (e) {
        console.error('Failed to check user permissions:', e);
      }

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (selectedRole) params.set('role', selectedRole);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.status === 403) {
        setUnauthorized(true);
      } else if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          roleCodes: [roleCode],
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'حدث خطأ أثناء إضافة المستخدم');
        return;
      }

      setFormSuccess('تم إنشاء حساب المستخدم وإسناد الصلاحيات بنجاح!');
      // Reset form
      setFullName('');
      setEmail('');
      setPhone('');
      setPassword('User@123456');

      fetchUsers();
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1200);
    } catch {
      setFormError('تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-teal-600" />
              إدارة المستخدمين والحسابات
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              إدارة حسابات منسوبي المنظومة، الملاك، المستأجرين، وتحديد الأدوار والصلاحيات
            </p>
          </div>

          {canCreateUser && (
            <button
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-900/10 transition-all active:scale-[0.98] shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مستخدم جديد</span>
            </button>
          )}
        </div>

        {unauthorized ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ليس لديك صلاحية إدارة المستخدمين</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              حسابك الحالي لا يمتلك الصلاحية المطلوبة (users:view). هذا القسم مخصص لمدير النظام فقط.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              <span>العودة للوحة التحكم</span>
            </Link>
          </div>
        ) : (
          <>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث بالاسم، البريد الإلكتروني، أو الهاتف..."
                className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-600 focus:border-teal-600 transition-colors bg-slate-50/50 hover:bg-white"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0"
            >
              بحث
            </button>
          </form>

          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-teal-600"
            >
              <option value="">جميع الأدوار ({users.length})</option>
              <option value="ADMIN">مدير النظام</option>
              <option value="PROPERTY_MANAGER">مدير الأملاك</option>
              <option value="ACCOUNTANT">المحاسب</option>
              <option value="MAINTENANCE_SUPERVISOR">مسؤول الصيانة</option>
              <option value="TECHNICIAN">فني ميداني</option>
              <option value="OWNER">المالك</option>
              <option value="TENANT">المستأجر</option>
            </select>

            <button
              onClick={() => {
                setSearch('');
                setSelectedRole('');
                fetchUsers();
              }}
              className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
              title="تحديث القائمة"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs sm:text-sm text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
              <span>جاري تحميل قائمة المستخدمين...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">لم يتم العثور على مستخدمين</p>
              <p className="text-xs text-slate-400 mt-1">جرّب تغيير عبارة البحث أو الفلتر</p>
            </div>
          ) : (
            <div className="table-responsive-container">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                    <th className="py-3 px-4">المستخدم</th>
                    <th className="py-3 px-4">البريد الإلكتروني</th>
                    <th className="py-3 px-4">الهاتف</th>
                    <th className="py-3 px-4">الأدوار الممنوحة</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4">آخر دخول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <span>{u.fullName}</span>
                            {u.username && (
                              <span className="block text-[11px] text-slate-400 font-normal">
                                @{u.username}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {u.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span dir="ltr">{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <RoleBadge key={r.id} roleCode={r.code} />
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={u.status} />
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString('ar-SA')
                          : 'لم يسجل دخول'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
        )}

        {/* Create User Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="إضافة مستخدم جديد للنظام"
          description="تسجيل حساب موظف أو فني أو مالك مع تحديد الدور الأساسي"
        >
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs sm:text-sm">
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: سلمان بن عبدالعزيز"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="salman@amarah.local"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الهاتف</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">كلمة المرور الافتراضية *</label>
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الدور الوظيفي الرئيسي *</label>
              <select
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold"
              >
                <option value="PROPERTY_MANAGER">مدير إدارة الأملاك</option>
                <option value="ACCOUNTANT">المحاسب المالي</option>
                <option value="MAINTENANCE_SUPERVISOR">مسؤول الصيانة</option>
                <option value="TECHNICIAN">الفني الميداني</option>
                <option value="OWNER">المالك</option>
                <option value="TENANT">المستأجر</option>
                <option value="ADMIN">مدير النظام (كامل الصلاحيات)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">حالة الحساب</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
              >
                <option value="ACTIVE">نشط (مفعل)</option>
                <option value="INACTIVE">غير نشط</option>
                <option value="SUSPENDED">موقوف</option>
              </select>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-900/10 transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <span>إنشاء الحساب</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
