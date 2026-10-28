'use client';

import React, { useState, useEffect } from 'react';
import {
  Building,
  Plus,
  Search,
  RefreshCw,
  Phone,
  Mail,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface OwnerRecord {
  id: string;
  name: string;
  idNumber: string | null;
  phone: string;
  email: string | null;
  bankName: string | null;
  iban: string | null;
  status: string;
  notes: string | null;
  propertyOwnerships: {
    sharePercentage: number;
    property: {
      id: string;
      name: string;
      code: string;
      city: string;
    };
  }[];
  ownerSettlements: {
    id: string;
    settlementNumber: string;
    netPayable: number;
    status: string;
  }[];
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<OwnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);
  const [canCreateOwner, setCanCreateOwner] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bankName, setBankName] = useState('مصرف الراجحي');
  const [iban, setIban] = useState('SA');
  const [notes, setNotes] = useState('');

  const fetchOwners = async () => {
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
          setCanCreateOwner(isAdmin || perms.includes('owners:create'));
        }
      } catch (e) {
        console.error('Failed to check user permissions:', e);
      }

      const res = await fetch('/api/owners');
      if (res.status === 403) {
        setUnauthorized(true);
      } else if (res.ok) {
        const data = await res.json();
        setOwners(data.owners || []);
      }
    } catch (err) {
      console.error('Error fetching owners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, idNumber, phone, email, bankName, iban, notes }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'فشل إضافة المالك');
        return;
      }

      setFormSuccess('تم تسجيل ملف المالك بنجاح!');
      setName('');
      setPhone('');
      fetchOwners();
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

  const filteredOwners = owners.filter((o) => {
    return (
      !search ||
      o.name.includes(search) ||
      o.phone.includes(search) ||
      (o.email && o.email.includes(search))
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Building className="w-6 h-6 text-emerald-600" />
              إدارة الملاك والأملاك المشتركة
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ملفات الملاك، نسب الملكية بالعقارات، بيانات الحسابات المصرفية، والتسويات المالية
            </p>
          </div>

          {canCreateOwner && (
            <button
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل مالك جديد</span>
            </button>
          )}
        </div>

        {unauthorized ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4 my-8">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ليس لديك صلاحية استعراض الملاك</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              حسابك الحالي لا يمتلك الصلاحية المطلوبة (owners:view). يرجى مراجعة إدارة النظام.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm"
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
              placeholder="ابحث باسم المالك، رقم الجوال، أو البريد الإلكتروني..."
              className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <button
            onClick={fetchOwners}
            className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Owners Grid */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-2 text-slate-400 text-xs sm:text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <span>جاري تحميل قائمة الملاك...</span>
          </div>
        ) : filteredOwners.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">لم يتم العثور على ملاك</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredOwners.map((o) => (
              <div
                key={o.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{o.name}</h3>
                      {o.idNumber && (
                        <span className="text-[11px] font-mono text-slate-400">
                          هوية / سجل: {o.idNumber}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={o.status} />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 my-3">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span dir="ltr">{o.phone}</span>
                    </div>
                    {o.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{o.email}</span>
                      </div>
                    )}
                    {o.iban && (
                      <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 font-mono">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>{o.bankName} • {o.iban}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Owned Properties List */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                    العقارات التابعة ({o.propertyOwnerships.length}):
                  </span>
                  <div className="space-y-1">
                    {o.propertyOwnerships.map((po, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg"
                      >
                        <span className="font-semibold text-slate-800">{po.property.name}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {po.sharePercentage}% ملكية
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}

        {/* Modal: Create Owner */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="تسجيل مالك جديد"
          description="إضافة ملف مالك فردي أو جهة استثمارية مع الحساب البنكي"
        >
          <form onSubmit={handleCreateOwner} className="space-y-4 text-xs sm:text-sm">
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
              <label className="block font-bold text-slate-700 mb-1">اسم المالك / الشركة *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: فهد بن عبدالعزيز السلمان"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهوية / السجل التجاري</label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="10XXXXXXXX"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 font-mono"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم البنك</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الآيبان (IBAN)</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="SA0000000000000000000000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 font-mono uppercase"
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
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'تسجيل المالك'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
