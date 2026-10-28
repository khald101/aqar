'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Printer,
  CheckCircle2,
  AlertCircle,
  Receipt as ReceiptIcon,
  FileCheck,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface PaymentRecord {
  id: string;
  paymentNumber: string;
  receiptNumber: string;
  amount: number;
  paymentMethod: string;
  referenceNo: string | null;
  paymentDate: string;
  status: string;
  notes: string | null;
  contract: {
    contractNumber: string;
    property: { name: string };
    unit: { unitNumber: string };
  };
  tenant: {
    fullName: string;
    phone: string;
  };
  allocations: {
    amount: number;
    rentSchedule: {
      installmentNo: number;
      amount: number;
      paidAmount: number;
      remainingAmount: number;
      status: string;
    };
  }[];
  receipt?: {
    receiptNumber: string;
    issuedAt: string;
  };
}

interface ContractOption {
  id: string;
  contractNumber: string;
  tenant: { fullName: string };
  property: { name: string };
  unit: { unitNumber: string };
  rentSchedules: {
    id: string;
    installmentNo: number;
    amount: number;
    remainingAmount: number;
    status: string;
  }[];
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [contracts, setContracts] = useState<ContractOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form State
  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [amount, setAmount] = useState('5000');
  const [paymentMethod, setPaymentMethod] = useState('MADA');
  const [referenceNo, setReferenceNo] = useState('MADA-9823412');
  const [notes, setNotes] = useState('سداد دفعة إيجار');

  const [unauthorized, setUnauthorized] = useState(false);
  const [canCreatePayment, setCanCreatePayment] = useState(true);

  const fetchData = async () => {
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
          setCanCreatePayment(isAdmin || perms.includes('financial:payments'));
        }
      } catch (e) {
        console.error('Failed to check user permissions:', e);
      }

      const [payRes, conRes] = await Promise.allSettled([
        fetch('/api/payments'),
        fetch('/api/contracts'),
      ]);

      if (payRes.status === 'fulfilled') {
        if (payRes.value.status === 403) {
          setUnauthorized(true);
        } else if (payRes.value.ok) {
          const payData = await payRes.value.json();
          setPayments(payData.payments || []);
        }
      }

      let loadedContracts: ContractOption[] = [];
      if (conRes.status === 'fulfilled' && conRes.value.ok) {
        const conData = await conRes.value.json();
        loadedContracts = conData.contracts || [];
        setContracts(loadedContracts);

        if (loadedContracts.length > 0 && !selectedContractId) {
          const firstContract = loadedContracts[0];
          setSelectedContractId(firstContract.id);
          const pendingSch = firstContract.rentSchedules?.find((s: any) => s.remainingAmount > 0);
          if (pendingSch) {
            setSelectedScheduleId(pendingSch.id);
            setAmount(pendingSch.remainingAmount.toString());
          }
        }
      }
    } catch (err) {
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleContractChange = (cId: string) => {
    setSelectedContractId(cId);
    if (!cId) {
      setSelectedScheduleId('');
      setAmount('0');
      return;
    }
    const contract = contracts.find((c) => c.id === cId);
    if (contract && contract.rentSchedules?.length > 0) {
      const pending = contract.rentSchedules.find((s) => s.remainingAmount > 0) || contract.rentSchedules[0];
      if (pending) {
        setSelectedScheduleId(pending.id);
        setAmount(pending.remainingAmount > 0 ? pending.remainingAmount.toString() : pending.amount.toString());
      } else {
        setSelectedScheduleId('');
        setAmount('0');
      }
    } else {
      setSelectedScheduleId('');
      setAmount('0');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: selectedContractId,
          rentScheduleId: selectedScheduleId || undefined,
          amount: parseFloat(amount),
          paymentMethod,
          referenceNo,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'حدث خطأ أثناء تسجيل الدفعة');
        return;
      }

      setFormSuccess('تم تسجيل التحصيل وتحديث الرصيد المتبقي وإصدار السند بنجاح!');
      fetchData();
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess(null);
      }, 1200);
    } catch {
      setFormError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    return (
      !search ||
      p.receiptNumber.includes(search) ||
      p.paymentNumber.includes(search) ||
      p.tenant.fullName.includes(search) ||
      p.contract.contractNumber.includes(search)
    );
  });

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'MADA': return <Badge variant="primary">مدى Mada</Badge>;
      case 'BANK_TRANSFER': return <Badge variant="info">تحويل مصرفي</Badge>;
      case 'CHEQUE': return <Badge variant="warning">شيك</Badge>;
      case 'CASH': return <Badge variant="neutral">نقدي</Badge>;
      default: return <Badge variant="neutral">{method}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-emerald-600" />
              التحصيلات، الدفعات وسندات القبض
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              تسجيل تحصيل الإيجارات، توزيع الدفعات، حساب المتبقي الدقيق، وتوليد سندات القبض المعتمدة
            </p>
          </div>

          {canCreatePayment && (
            <button
              onClick={() => {
                setReferenceNo(`REF-${Date.now().toString().slice(-6)}`);
                setFormError(null);
                setFormSuccess(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-900/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل تحصيل دفعة جديدة</span>
            </button>
          )}
        </div>

        {unauthorized ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ليس لديك صلاحية الوصول لسجل التحصيلات</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              حسابك الحالي لا يمتلك الصلاحية المطلوبة (financial:view أو financial:payments).
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
            {/* Filter and Search Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث برقم السند، رقم الدفعة، اسم المستأجر، أو رقم العقد..."
                  className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <button
                onClick={fetchData}
                className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 self-end sm:self-center"
                title="تحديث البيانات"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {loading ? (
                <div className="py-20 text-center flex flex-col items-center gap-2 text-slate-400 text-xs sm:text-sm">
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                  <span>جاري تحميل سجل التحصيلات وسندات القبض...</span>
                </div>
              ) : filteredPayments.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <ReceiptIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">لا توجد تحصيلات مسجلة</p>
              <p className="text-xs text-slate-400 mt-1">اضغط على زر «تسجيل تحصيل دفعة جديدة» للبدء</p>
            </div>
          ) : (
            <div className="table-responsive-container">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                    <th className="py-3 px-4">رقم سند القبض</th>
                    <th className="py-3 px-4">المستأجر والعقد</th>
                    <th className="py-3 px-4">المبلغ المحصل</th>
                    <th className="py-3 px-4">طريقة السداد والمرجع</th>
                    <th className="py-3 px-4">توزيع الاستحقاق</th>
                    <th className="py-3 px-4">تاريخ السداد</th>
                    <th className="py-3 px-4 text-center">السند الرسمي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 whitespace-nowrap">
                        <span className="bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          {p.receiptNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{p.tenant.fullName}</span>
                        <span className="text-[11px] text-slate-400">
                          عقد {p.contract.contractNumber} • وحدة {p.contract.unit.unitNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <span className="text-sm font-extrabold text-emerald-700">
                          {p.amount.toLocaleString()} ر.س
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {getMethodBadge(p.paymentMethod)}
                          {p.referenceNo && (
                            <span className="font-mono text-xs text-slate-500">
                              #{p.referenceNo}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {p.allocations?.[0] ? (
                          <div className="text-xs">
                            <span className="font-semibold text-slate-800">
                              دفعة قسط #{p.allocations[0].rentSchedule.installmentNo}
                            </span>
                            <span className="block text-[11px] text-slate-500">
                              المتبقي بالقسط: {p.allocations[0].rentSchedule.remainingAmount.toLocaleString()} ر.س
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 text-xs whitespace-nowrap">
                        {new Date(p.paymentDate).toLocaleString('ar-SA')}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors inline-flex items-center gap-1"
                        >
                          <ReceiptIcon className="w-3.5 h-3.5" />
                          <span>معاينة السند</span>
                        </button>
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

        {/* Modal: Record Payment */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="تحصيل دفعة إيجار وإصدار سند قبض"
          description="تسجيل المبلغ، توزيع القسط، واحتساب الرصيد المتبقي بدقة متناهية"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs sm:text-sm">
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
              <label className="block font-bold text-slate-700 mb-1">اختر عقد الإيجار *</label>
              <select
                required
                value={selectedContractId}
                onChange={(e) => handleContractChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 font-bold bg-white text-slate-800"
              >
                <option value="">-- اختر عقد الإيجار --</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    عقد {c.contractNumber} — {c.tenant.fullName} ({c.property.name})
                  </option>
                ))}
                {contracts.length === 0 && (
                  <option value="" disabled>
                    لا توجد عقود مسجلة
                  </option>
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الاستحقاق / القسط المستهدف *</label>
              <select
                value={selectedScheduleId}
                onChange={(e) => {
                  setSelectedScheduleId(e.target.value);
                  const contract = contracts.find((c) => c.id === selectedContractId);
                  const sch = contract?.rentSchedules.find((s) => s.id === e.target.value);
                  if (sch) setAmount(sch.remainingAmount.toString());
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 font-semibold bg-white text-slate-800"
              >
                <option value="">
                  {!selectedContractId
                    ? '-- يرجى اختيار عقد الإيجار أولاً --'
                    : '-- اختر القسط المستهدف --'}
                </option>
                {contracts
                  .find((c) => c.id === selectedContractId)
                  ?.rentSchedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      قسط #{s.installmentNo} — الإجمالي: {s.amount.toLocaleString('ar-SA')} ر.س | المتبقي غير المسدد: {s.remainingAmount.toLocaleString('ar-SA')} ر.س
                    </option>
                  ))}
                {contracts.find((c) => c.id === selectedContractId) && (!contracts.find((c) => c.id === selectedContractId)?.rentSchedules || contracts.find((c) => c.id === selectedContractId)?.rentSchedules.length === 0) && (
                  <option value="" disabled>
                    لا توجد أقساط مسجلة لهذا العقد
                  </option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المبلغ المراد تحصيله (ر.س) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 font-mono font-extrabold text-base text-emerald-800"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  يدعم السداد الجزئي (مثال: سداد 5,000 من أصل 12,000)
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">طريقة السداد *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 font-bold"
                >
                  <option value="MADA">بطاقة مدى (Mada)</option>
                  <option value="BANK_TRANSFER">تحويل مصرفي مباشر</option>
                  <option value="CHEQUE">شيك مصرفي معتمد</option>
                  <option value="CASH">نقداً</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الرقم المرجعي / رقم الحوالة</label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="MADA-9823412"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ملاحظات التحصيل</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="سداد دفعة إيجار سكنية"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-600"
              />
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
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-60"
              >
                {isSubmitting ? 'جاري التحصيل...' : 'تأكيد السداد وإصدار السند'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Receipt Voucher Preview */}
        <Modal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          title="سند قبض رسمي معتمد"
          description={selectedReceipt ? `سند رقم: ${selectedReceipt.receiptNumber}` : ''}
        >
          {selectedReceipt && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="border-2 border-dashed border-emerald-300 rounded-2xl p-4 sm:p-5 bg-emerald-50/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">نظام عِمارة لإدارة الأملاك</h3>
                    <p className="text-xs text-slate-500">إيصال تحصيل وسند قبض مالي</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
                    {selectedReceipt.receiptNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-xs">استلمنا من المستأجر:</span>
                    <span className="font-bold text-slate-900">{selectedReceipt.tenant.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">رقم العقد والوحدة:</span>
                    <span className="font-semibold text-slate-800">
                      عقد {selectedReceipt.contract.contractNumber} (وحدة {selectedReceipt.contract.unit.unitNumber})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">المبلغ المستلم:</span>
                    <span className="text-base font-black text-emerald-700">
                      {selectedReceipt.amount.toLocaleString()} ريال سعودي
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs">طريقة السداد:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedReceipt.paymentMethod} {selectedReceipt.referenceNo ? `(#${selectedReceipt.referenceNo})` : ''}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-xs">تاريخ وساعة القبض:</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(selectedReceipt.paymentDate).toLocaleString('ar-SA')}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                  <span>تم إصدار السند إلكترونياً وتوثيقه في سجل التدقيق المالي</span>
                  <span className="font-bold text-emerald-700">معتمد ورسمي ✓</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>طباعة السند</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-5 py-2 bg-slate-800 text-white rounded-xl font-bold"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
