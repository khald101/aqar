'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Building,
  User,
  ShieldAlert,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface RentScheduleItem {
  id: string;
  installmentNo: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  notes: string | null;
}

interface ContractRecord {
  id: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  rentAmount: number;
  paymentCycle: string;
  depositAmount: number;
  status: string;
  property: {
    id: string;
    name: string;
    code: string;
  };
  unit: {
    id: string;
    unitNumber: string;
    type: string;
  };
  tenant: {
    id: string;
    fullName: string;
    phone: string;
    idNumber: string;
  };
  rentSchedules: RentScheduleItem[];
}

interface PropertyOption {
  id: string;
  name: string;
  units: {
    id: string;
    unitNumber: string;
    status: string;
    yearlyRent: number | null;
  }[];
}

interface TenantOption {
  id: string;
  fullName: string;
  idNumber: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Contract Form State
  const [contractNumber, setContractNumber] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [startDate, setStartDate] = useState('2026-02-01');
  const [endDate, setEndDate] = useState('2027-01-31');
  const [rentAmount, setRentAmount] = useState('50000');
  const [paymentCycle, setPaymentCycle] = useState('QUARTERLY');
  const [depositAmount, setDepositAmount] = useState('3000');
  const [terms, setTerms] = useState('عقد إيجار قياسي موحد وفق اشتراطات الهيئة العامة للعقار.');

  const [unauthorized, setUnauthorized] = useState(false);
  const [canCreateContract, setCanCreateContract] = useState(true);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setUnauthorized(false);

      // Check current user permissions
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          const perms: string[] = meData.user?.permissions || [];
          const roles: string[] = meData.user?.roles || [];
          const isAdmin = roles.includes('ADMIN');
          const isManager = roles.includes('PROPERTY_MANAGER');
          setCanCreateContract(isAdmin || isManager || perms.includes('contracts:create'));
        }
      } catch (e) {
        console.error('Failed to check user permissions:', e);
      }

      // Fetch endpoints independently so failure of one does not break others
      const [cRes, pRes, tRes] = await Promise.allSettled([
        fetch('/api/contracts'),
        fetch('/api/properties'),
        fetch('/api/tenants'),
      ]);

      if (cRes.status === 'fulfilled') {
        if (cRes.value.status === 403) {
          setUnauthorized(true);
        } else if (cRes.value.ok) {
          const cData = await cRes.value.json();
          setContracts(cData.contracts || []);
        }
      }

      let loadedProperties: PropertyOption[] = [];
      if (pRes.status === 'fulfilled' && pRes.value.ok) {
        const pData = await pRes.value.json();
        loadedProperties = pData.properties || [];
        setProperties(loadedProperties);
      }

      let loadedTenants: TenantOption[] = [];
      if (tRes.status === 'fulfilled' && tRes.value.ok) {
        const tData = await tRes.value.json();
        loadedTenants = tData.tenants || [];
        setTenants(loadedTenants);
      }

      // Pre-select first property and first available unit if available
      if (loadedProperties.length > 0 && !selectedPropertyId) {
        const firstProp = loadedProperties[0];
        setSelectedPropertyId(firstProp.id);
        if (firstProp.units?.length > 0) {
          setSelectedUnitId(firstProp.units[0].id);
          if (firstProp.units[0].yearlyRent) {
            setRentAmount(firstProp.units[0].yearlyRent.toString());
          }
        }
      }

      if (loadedTenants.length > 0 && !selectedTenantId) {
        setSelectedTenantId(loadedTenants[0].id);
      }
    } catch (err) {
      console.error('Error fetching contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handlePropertyChange = (propId: string) => {
    setSelectedPropertyId(propId);
    const prop = properties.find((p) => p.id === propId);
    if (prop && prop.units?.length > 0) {
      setSelectedUnitId(prop.units[0].id);
      if (prop.units[0].yearlyRent) {
        setRentAmount(prop.units[0].yearlyRent.toString());
      }
    } else {
      setSelectedUnitId('');
    }
  };

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedTenantId) {
      setFormError('يرجى اختيار المستأجر من القائمة');
      return;
    }
    if (!selectedPropertyId) {
      setFormError('يرجى اختيار العقار');
      return;
    }
    if (!selectedUnitId) {
      setFormError('يرجى اختيار الوحدة العقارية التابعة للعقار');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractNumber,
          propertyId: selectedPropertyId,
          unitId: selectedUnitId,
          tenantId: selectedTenantId,
          startDate,
          endDate,
          totalAmount: rentAmount,
          rentAmount,
          paymentCycle,
          depositAmount,
          terms,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'حدث خطأ أثناء إنشاء العقد');
        return;
      }

      setFormSuccess('تم إنشاء عقد الإيجار وتوليد جدول الاستحقاقات بنجاح!');
      setContractNumber('');
      fetchContracts();
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

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch =
      !search ||
      c.contractNumber.includes(search) ||
      c.tenant.fullName.includes(search) ||
      c.property.name.includes(search);
    const matchesStatus = !statusFilter || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getCycleLabel = (cycle: string) => {
    switch (cycle) {
      case 'MONTHLY': return 'شهري (12 دفعة)';
      case 'QUARTERLY': return 'ربع سنوي (4 دفعات)';
      case 'SEMI_ANNUAL': return 'نصف سنوي (دفعتان)';
      case 'ANNUAL': return 'سنوي (دفعة واحدة)';
      default: return cycle;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" />
              إدارة عقود الإيجار وجداول الاستحقاقات
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              توثيق عقود الإيجار، دورات السداد، متابعة الدفعات المستحقة والمتبقية، ومنع تعارض الإشغال
            </p>
          </div>

          {canCreateContract && (
            <button
              onClick={() => {
                setContractNumber(`CNT-2026-000${contracts.length + 2}`);
                if (properties.length > 0 && !selectedPropertyId) {
                  handlePropertyChange(properties[0].id);
                }
                if (tenants.length > 0 && !selectedTenantId) {
                  setSelectedTenantId(tenants[0].id);
                }
                setFormError(null);
                setFormSuccess(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-900/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء عقد إيجار جديد</span>
            </button>
          )}
        </div>

        {unauthorized ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ليس لديك صلاحية استعراض عقود الإيجار</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              حسابك الحالي لا يمتلك الصلاحية المطلوبة (contracts:view) للوصول إلى هذا القسم.
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
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث برقم العقد، اسم المستأجر، أو العقار..."
                  className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white"
                >
                  <option value="">جميع حالات العقود</option>
                  <option value="ACTIVE">عقود سارية</option>
                  <option value="EXPIRED">منتهية</option>
                  <option value="TERMINATED">مفسوخة</option>
                </select>

                <button
                  onClick={fetchContracts}
                  className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"
                  title="تحديث العقود"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

        {/* Contracts Cards with Expandable Rent Schedules */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-2 text-slate-400 text-xs sm:text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
            <span>جاري تحميل عقود الإيجار والاستحقاقات...</span>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">لا توجد عقود إيجار مطابقة</p>
            <p className="text-xs text-slate-400 mt-1">جرّب تغيير عبارة البحث أو اضغط على «إنشاء عقد جديد»</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredContracts.map((c) => {
              const isExpanded = expandedContractId === c.id;
              const totalPaid = c.rentSchedules.reduce((acc, s) => acc + s.paidAmount, 0);
              const totalRemaining = c.rentSchedules.reduce((acc, s) => acc + s.remainingAmount, 0);

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                >
                  {/* Contract Header Row */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="p-3 bg-teal-50 text-teal-700 rounded-xl border border-teal-100 shrink-0">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                            {c.contractNumber}
                          </span>
                          <StatusBadge status={c.status} />
                          <Badge variant="neutral">{getCycleLabel(c.paymentCycle)}</Badge>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5 flex items-center gap-2">
                          <span>{c.tenant.fullName}</span>
                          <span className="text-xs font-normal text-slate-500">
                            (وحدة #{c.unit.unitNumber} • {c.property.name})
                          </span>
                        </h3>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[11px]">القيمة الإجمالية</span>
                        <span className="text-sm font-bold text-slate-900">
                          {c.rentAmount.toLocaleString()} ر.س
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">المحصل فعلياً</span>
                        <span className="text-sm font-bold text-emerald-600">
                          {totalPaid.toLocaleString()} ر.س
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">المتبقي المستحق</span>
                        <span className="text-sm font-bold text-rose-600">
                          {totalRemaining.toLocaleString()} ر.س
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href="/payments"
                          className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl border border-emerald-200 transition-colors inline-flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>تحصيل دفعة</span>
                        </Link>

                        <button
                          onClick={() => setExpandedContractId(isExpanded ? null : c.id)}
                          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                          title="عرض جدول الاستحقاقات"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Rent Schedules Accordion */}
                  {isExpanded && (
                    <div className="bg-slate-50/70 border-t border-slate-100 p-4 sm:p-5 animate-fade-in">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <span>جدول استحقاقات العقد ({c.rentSchedules.length} دفعات):</span>
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          فترة العقد: {new Date(c.startDate).toLocaleDateString('ar-SA')} إلى {new Date(c.endDate).toLocaleDateString('ar-SA')}
                        </span>
                      </div>

                      <div className="table-responsive-container bg-white rounded-xl border border-slate-200/80 overflow-hidden">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200/80">
                              <th className="py-2.5 px-3">الدفعة</th>
                              <th className="py-2.5 px-3">تاريخ الاستحقاق</th>
                              <th className="py-2.5 px-3">مبلغ الدفعة</th>
                              <th className="py-2.5 px-3">المسدد</th>
                              <th className="py-2.5 px-3">المتبقي</th>
                              <th className="py-2.5 px-3">الحالة</th>
                              <th className="py-2.5 px-3">ملاحظات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {c.rentSchedules.map((sch) => (
                              <tr key={sch.id} className="hover:bg-slate-50/50">
                                <td className="py-3 px-3 font-bold font-mono">#{sch.installmentNo}</td>
                                <td className="py-3 px-3 text-slate-700">
                                  {new Date(sch.dueDate).toLocaleDateString('ar-SA')}
                                </td>
                                <td className="py-3 px-3 font-bold text-slate-900">
                                  {sch.amount.toLocaleString()} ر.س
                                </td>
                                <td className="py-3 px-3 font-bold text-emerald-600">
                                  {sch.paidAmount.toLocaleString()} ر.س
                                </td>
                                <td className="py-3 px-3 font-bold text-rose-600">
                                  {sch.remainingAmount.toLocaleString()} ر.س
                                </td>
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
                                    {sch.status === 'PAID'
                                      ? 'مسددة بالكامل'
                                      : sch.status === 'PARTIALLY_PAID'
                                      ? 'سداد جزئي'
                                      : 'بانتظار السداد'}
                                  </Badge>
                                </td>
                                <td className="py-3 px-3 text-slate-500 text-[11px]">
                                  {sch.notes || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </>
        )}

        {/* Modal: Create Contract */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="تسجيل عقد إيجار وتوليد الاستحقاقات"
          description="ربط المستأجر بالوحدة، تحديد دورة السداد، وتوليد جدول الأقساط آلياً"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateContract} className="space-y-4 text-xs sm:text-sm">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم العقد *</label>
                <input
                  type="text"
                  required
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  placeholder="CNT-2026-0002"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono uppercase bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المستأجر *</label>
                <select
                  required
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-bold bg-white text-slate-800"
                >
                  <option value="">-- اختر المستأجر --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} (هوية: {t.idNumber})
                    </option>
                  ))}
                  {tenants.length === 0 && (
                    <option value="" disabled>
                      لا يوجد مستأجرين متاحين
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">العقار *</label>
                <select
                  required
                  value={selectedPropertyId}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold bg-white text-slate-800"
                >
                  <option value="">-- اختر العقار --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  {properties.length === 0 && (
                    <option value="" disabled>
                      لا توجد عقارات متاحة
                    </option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الوحدة العقارية *</label>
                <select
                  required
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold bg-white text-slate-800"
                >
                  <option value="">
                    {!selectedPropertyId
                      ? '-- يرجى اختيار العقار أولاً --'
                      : '-- اختر الوحدة العقارية --'}
                  </option>
                  {properties
                    .find((p) => p.id === selectedPropertyId)
                    ?.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        وحدة #{u.unitNumber} ({u.status === 'VACANT' ? '🟢 شاغرة ومتاحة' : `🔴 ${u.status}`}) {u.yearlyRent ? `— ${u.yearlyRent.toLocaleString('ar-SA')} ر.س/سنة` : ''}
                      </option>
                    ))}
                  {properties.find((p) => p.id === selectedPropertyId) && (!properties.find((p) => p.id === selectedPropertyId)?.units || properties.find((p) => p.id === selectedPropertyId)?.units.length === 0) && (
                    <option value="" disabled>
                      لا توجد وحدات مسجلة في هذا العقار
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ بداية العقد *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تاريخ نهاية العقد *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">القيمة الإجمالية (ر.س) *</label>
                <input
                  type="number"
                  required
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">دورية السداد *</label>
                <select
                  value={paymentCycle}
                  onChange={(e) => setPaymentCycle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-bold"
                >
                  <option value="ANNUAL">دفعة سنوية واحدة</option>
                  <option value="SEMI_ANNUAL">نصف سنوي (دفعتان)</option>
                  <option value="QUARTERLY">ربع سنوي (4 دفعات)</option>
                  <option value="MONTHLY">شهري (12 دفعة)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">مبلغ التأمين (ر.س)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">الشروط والأحكام</label>
              <textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 text-xs"
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
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-60"
              >
                {isSubmitting ? 'جاري إنشاء العقد...' : 'حفظ وتوليد الأقساط'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
