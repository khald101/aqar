'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  FileText,
  CreditCard,
  Wrench,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Building,
  ArrowRight,
  Plus,
  ShieldCheck,
  UserCheck,
  Phone,
  MessageSquare,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface TicketRecord {
  id: string;
  ticketNumber: string;
  category: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  availableTime: string | null;
  createdAt: string;
  property: { name: string };
  unit?: { unitNumber: string } | null;
  workOrders: {
    id: string;
    orderNumber: string;
    technicianName: string | null;
    status: string;
    workReport: string | null;
  }[];
  comments: {
    id: string;
    authorName: string;
    authorRole: string;
    comment: string;
    createdAt: string;
  }[];
}

export default function TenantPortalPage() {
  const [data, setData] = useState<any>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  // New Maintenance Ticket Modal
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState('PLUMBING');
  const [priority, setPriority] = useState('URGENT');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [availableTime, setAvailableTime] = useState('مساءً بعد الساعة 5');

  const loadTenantData = React.useCallback(async () => {
    try {
      setLoading(true);
      setUnauthorized(false);

      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meData = await meRes.json();
        const user = meData.user;
        const isTenantOrAdmin = user?.roles?.includes('TENANT') || user?.roles?.includes('ADMIN');
        if (!isTenantOrAdmin) {
          setUnauthorized(true);
          setLoading(false);
          return;
        }
      }

      const [conRes, payRes, mRes] = await Promise.all([
        fetch('/api/contracts'),
        fetch('/api/payments'),
        fetch('/api/maintenance'),
      ]);

      if (conRes.ok && mRes.ok) {
        const conData = await conRes.json();
        const payData = payRes.ok ? await payRes.json() : null;
        const mData = await mRes.json();

        const myContract = conData.contracts?.[0] || null;
        const myPayments = payData?.payments || myContract?.payments || [];
        const myTickets = mData.tickets || [];

        setData({ contract: myContract, payments: myPayments, tickets: myTickets });
      }
    } catch (err) {
      console.error('Error loading tenant portal data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.contract) return;

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: data.contract.propertyId,
          unitId: data.contract.unitId,
          tenantId: data.contract.tenantId,
          category,
          priority,
          title,
          description,
          availableTime,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setFormError(resData.error || 'تعذر إرسال البلاغ');
        return;
      }

      setFormSuccess('تم رفع بلاغ الصيانة بنجاح وإشعار فريق الصيانة والفني المختص!');
      setTitle('');
      setDescription('');
      loadTenantData();

      setTimeout(() => {
        setIsTicketModalOpen(false);
        setFormSuccess(null);
      }, 1500);
    } catch {
      setFormError('حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            جديد (بانتظار المعاينة)
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            قيد التنفيذ والمباشرة
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            تم الإصلاح والمعالجة
          </span>
        );
      case 'CLOSED':
        return (
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            مغلق ومعتمد نهائياً
          </span>
        );
      default:
        return <StatusBadge status={status} />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'PLUMBING':
        return 'سباكة وتسريب مياه';
      case 'ELECTRICAL':
        return 'كهرباء وإنارة';
      case 'HVAC':
        return 'تكييف وتبريد';
      case 'CARPENTRY':
        return 'أبواب ونجارة';
      case 'APPLIANCE':
        return 'أجهزة ومضخات';
      default:
        return 'صيانة عامة';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-slate-400">جاري تحميل بوابة المستأجر...</div>
      </DashboardLayout>
    );
  }

  if (unauthorized) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-xs max-w-lg mx-auto mt-10">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <KeyRound className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">هذه البوابة مخصصة للمستأجرين فقط</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            حسابك الحالي لا يمتلك صفة مستأجر مسجل في النظام.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm"
          >
            <span>العودة للوحة التحكم</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const contract = data?.contract;
  const tickets: TicketRecord[] = data?.tickets || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-3 border border-teal-500/30">
              <KeyRound className="w-3.5 h-3.5" />
              بوابة المستأجر الذاتية — عِمارة
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              مرحباً بك، {contract?.tenant?.fullName || 'عزيزي المستأجر'}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
              تابع عقد إيجارك، جدول دفعاتك، وارفع وتابع بلاغات الصيانة للوحدة بكل سهولة
            </p>
          </div>

          {contract && (
            <button
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setIsTicketModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-950/20 transition-all active:scale-[0.98] shrink-0"
            >
              <Wrench className="w-4 h-4" />
              <span>رفع بلاغ صيانة للوحدة</span>
            </button>
          )}
        </div>

        {contract ? (
          <>
            {/* Active Lease & Unit Overview */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    عقد رقم: {contract.contractNumber}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 mt-1">
                    {contract.property.name} — وحدة رقم #{contract.unit.unitNumber}
                  </h2>
                </div>
                <StatusBadge status={contract.status} />
              </div>

              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">الإيجار السنوي:</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {contract.rentAmount.toLocaleString()} ر.س
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">دورة السداد:</span>
                  <span className="text-base font-bold text-teal-700">
                    {contract.paymentCycle === 'QUARTERLY' ? 'ربع سنوي (4 أقساط)' : contract.paymentCycle}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">تاريخ بداية العقد:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(contract.startDate).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">تاريخ نهاية العقد:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(contract.endDate).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>
            </div>

            {/* Maintenance Tickets Section (Dedicated for Tenant) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-amber-600" />
                    <span>سجل طلبات وبلاغات الصيانة للوحدة</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                      {tickets.length} بلاغ
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    يمكنك رفع بلاغ عن أي عطل في شقتك/عقارك ومتابعة رد الفني وحالة الإصلاح مباشرة
                  </p>
                </div>

                <button
                  onClick={() => {
                    setFormError(null);
                    setFormSuccess(null);
                    setIsTicketModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>فتح بلاغ جديد</span>
                </button>
              </div>

              {tickets.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600">لا توجد بلاغات صيانة مسجلة حالياً</p>
                  <p className="text-xs text-slate-400 mt-1">
                    إذا واجهتك أي مشكلة (تسريب مياه، كهرباء، تكييف)، اضغط على «فتح بلاغ جديد»
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/40 hover:bg-white transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {t.ticketNumber}
                          </span>
                          <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                            {getCategoryLabel(t.category)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(t.createdAt).toLocaleDateString('ar-SA')}
                          </span>
                        </div>
                        {getStatusBadge(t.status)}
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{t.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t.description}</p>
                      </div>

                      {/* Work Order & Technician Assignment Info */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-3">
                          {t.workOrders?.[0] ? (
                            <div className="flex items-center gap-1.5 text-teal-700 font-bold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>
                                الفني المكلف: {t.workOrders[0].technicianName || 'فريق الصيانة'} (أمر عمل: {t.workOrders[0].orderNumber})
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              بانتظار تكليف الفني المختص
                            </span>
                          )}

                          {t.availableTime && (
                            <span className="text-slate-500 text-[11px]">
                              الوقت المفضل: {t.availableTime}
                            </span>
                          )}
                        </div>

                        {t.workOrders?.[0]?.workReport && (
                          <div className="text-[11px] text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-900">تقرير الفني: </span>
                            {t.workOrders[0].workReport}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  ملاحظة للمستأجر: تعديل حالة البلاغ وتكليف أوامر العمل يتم حصراً عبر فني وإدارة الصيانة لضمان جودة الإنجاز.
                </span>
              </div>
            </div>

            {/* Installments Schedule */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-600" />
                جدول الدفعات والاستحقاقات
              </h3>

              <div className="table-responsive-container">
                <table className="w-full text-right text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">الدفعة</th>
                      <th className="py-2.5 px-3">تاريخ الاستحقاق</th>
                      <th className="py-2.5 px-3">المبلغ الإجمالي</th>
                      <th className="py-2.5 px-3">المسدد</th>
                      <th className="py-2.5 px-3">المتبقي</th>
                      <th className="py-2.5 px-3">حالة السداد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contract.rentSchedules?.map((sch: any) => (
                      <tr key={sch.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-bold font-mono">#{sch.installmentNo}</td>
                        <td className="py-3 px-3">{new Date(sch.dueDate).toLocaleDateString('ar-SA')}</td>
                        <td className="py-3 px-3 font-bold">{sch.amount.toLocaleString()} ر.س</td>
                        <td className="py-3 px-3 font-bold text-emerald-600">{sch.paidAmount.toLocaleString()} ر.س</td>
                        <td className="py-3 px-3 font-bold text-rose-600">{sch.remainingAmount.toLocaleString()} ر.س</td>
                        <td className="py-3 px-3">
                          <Badge
                            variant={
                              sch.status === 'PAID'
                                ? 'success'
                                : sch.status === 'PARTIALLY_PAID'
                                ? 'warning'
                                : 'info'
                            }
                          >
                            {sch.status === 'PAID' ? 'مسددة' : sch.status === 'PARTIALLY_PAID' ? 'سداد جزئي' : 'مستحقة'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Link to Payments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/payments"
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-400 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">سندات القبض وإيصالات السداد</h4>
                    <p className="text-xs text-slate-500">معاينة وطباعة إيصالات السداد الرسمية</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 rotate-180" />
              </Link>

              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-400 transition-all flex items-center justify-between text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">إبلاغ عن عطل جديد بالوحدة</h4>
                    <p className="text-xs text-slate-500">تسريب مياه، كهرباء، صيانة أقفال أو تكييف</p>
                  </div>
                </div>
                <Plus className="w-5 h-5 text-amber-600" />
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center text-slate-500 border border-slate-200">
            <KeyRound className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800">لا يوجد عقد إيجار نشط مرتبط بهذا الحساب حالياً</p>
          </div>
        )}

        {/* Modal: Tenant Raise Maintenance Ticket */}
        <Modal
          isOpen={isTicketModalOpen}
          onClose={() => setIsTicketModalOpen(false)}
          title="رفع بلاغ صيانة للوحدة المستأجرة"
          description={
            contract
              ? `${contract.property.name} — وحدة رقم #${contract.unit.unitNumber}`
              : 'تسجيل بلاغ صيانة'
          }
        >
          <form onSubmit={handleCreateTicket} className="space-y-4 text-xs sm:text-sm">
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

            {/* Target Unit Info Box */}
            {contract && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">العقار والوحدة المستهدفة:</span>
                  <span className="font-bold text-slate-800">
                    {contract.property.name} (وحدة #{contract.unit.unitNumber})
                  </span>
                </div>
                <span className="text-[11px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {contract.contractNumber}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">تصنيف العطل *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-semibold bg-white"
                >
                  <option value="PLUMBING">سباكة وتسريب مياه</option>
                  <option value="ELECTRICAL">كهرباء وإنارة</option>
                  <option value="HVAC">تكييف وتبريد</option>
                  <option value="CARPENTRY">أبواب ونجارة</option>
                  <option value="APPLIANCE">أجهزة ومضخات</option>
                  <option value="GENERAL">صيانة عامة أخرى</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">مستوى الأولوية *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold bg-white"
                >
                  <option value="URGENT">عاجل وطارئ (مثل تسريب مياه أو انقطاع)</option>
                  <option value="HIGH">مرتفع (خلال 24 ساعة)</option>
                  <option value="MEDIUM">متوسط (خلال 3 أيام)</option>
                  <option value="LOW">منخفض (صيانة اعتيادية)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">عنوان المشكلة *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تسريب مياه في سقف الشقة من الدور العلوي"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">وصف العطل بالتفصيل *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وضح موقع التسريب أو المشكلة بالتحديد ليسهل على الفني المباشرة..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الوقت المفضل للزيارة والمعاينة</label>
              <input
                type="text"
                value={availableTime}
                onChange={(e) => setAvailableTime(e.target.value)}
                placeholder="مثال: بعد الساعة 5 مساءً، أو يوم السبت صباحاً"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {isSubmitting ? 'جاري الإرسال...' : 'إرسال البلاغ لفريق الصيانة'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
