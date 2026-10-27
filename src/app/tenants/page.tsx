'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  RefreshCw,
  Phone,
  Mail,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Building,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface TenantRecord {
  id: string;
  fullName: string;
  idNumber: string;
  phone: string;
  email: string | null;
  nationality: string | null;
  emergencyContact: string | null;
  status: string;
  contracts: {
    id: string;
    contractNumber: string;
    rentAmount: number;
    status: string;
    property: { name: string };
    unit: { unitNumber: string; type: string };
  }[];
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [canCreateTenant, setCanCreateTenant] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('سعودي');
  const [emergencyContact, setEmergencyContact] = useState('');

  const fetchTenants = async () => {
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
          setCanCreateTenant(isAdmin || perms.includes('tenants:create'));
        }
      } catch (e) {
        console.error('Failed to check user permissions:', e);
      }

      const res = await fetch('/api/tenants');
      if (res.status === 403) {
        setUnauthorized(true);
      } else if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, idNumber, phone, email, nationality, emergencyContact }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'فشل تسجيل المستأجر');
        return;
      }

      setFormSuccess('تم تسجيل ملف المستأجر بنجاح!');
      setFullName('');
      setIdNumber('');
      setPhone('');
      fetchTenants();
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1000);
    } catch {
      setFormError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTenants = tenants.filter((t) => {
    return (
      !search ||
      t.fullName.includes(search) ||
      t.phone.includes(search) ||
      t.idNumber.includes(search)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-6 h-6 text-teal-600" />
              إدارة المستأجرين والوحدات المؤجرة
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              الملف الموحد لكل مستأجر، أرقام الهويات، العقود المرتبطة، والمدفوعات
            </p>
          </div>

          {canCreateTenant && (
            <button
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-900/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل مستأجر جديد</span>
            </button>
          )}
        </div>

        {unauthorized ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4 my-8">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ليس لديك صلاحية استعراض المستأجرين</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              حسابك الحالي لا يمتلك الصلاحية المطلوبة (tenants:view). يرجى مراجعة إدارة النظام.
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
            {/* Search */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم، رقم الهوية، أو الهاتف..."
              className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <button
            onClick={fetchTenants}
            className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tenants Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-2 text-slate-400 text-xs sm:text-sm">
              <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
              <span>جاري تحميل بيانات المستأجرين...</span>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <KeyRound className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">لم يتم العثور على مستأجرين</p>
            </div>
          ) : (
            <div className="table-responsive-container">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                    <th className="py-3 px-4">اسم المستأجر</th>
                    <th className="py-3 px-4">رقم الهوية / الإقامة</th>
                    <th className="py-3 px-4">الهاتف والبريد</th>
                    <th className="py-3 px-4">الوحدات والعقود النشطة</th>
                    <th className="py-3 px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {t.fullName.charAt(0)}
                          </div>
                          <div>
                            <span>{t.fullName}</span>
                            <span className="block text-[11px] text-slate-400 font-normal">
                              الجنسية: {t.nationality || 'سعودي'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {t.idNumber}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span dir="ltr">{t.phone}</span>
                        </div>
                        {t.email && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{t.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {t.contracts?.length > 0 ? (
                          t.contracts.map((c) => (
                            <div key={c.id} className="text-xs">
                              <span className="font-semibold text-teal-800">
                                {c.property.name} (وحدة #{c.unit.unitNumber})
                              </span>
                              <span className="block text-[11px] text-slate-400 font-mono">
                                عقد {c.contractNumber} • {c.rentAmount.toLocaleString()} ر.س
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400">لا يوجد عقد نشط</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={t.status} />
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

        {/* Modal: Create Tenant */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="تسجيل ملف مستأجر جديد"
          description="إضافة مستأجر فردي أو تجاري لتمكينه من استئجار الوحدات"
        >
          <form onSubmit={handleCreateTenant} className="space-y-4 text-xs sm:text-sm">
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
                placeholder="سعد بن إبراهيم المنصور"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهوية الوطنية / الإقامة *</label>
                <input
                  type="text"
                  required
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="10XXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tenant@example.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الجنسية</label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'تسجيل المستأجر'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
