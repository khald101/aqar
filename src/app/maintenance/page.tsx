'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building,
  UserCheck,
  ShieldAlert,
  ChevronDown,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface WorkOrderRecord {
  id: string;
  orderNumber: string;
  technicianName: string | null;
  scheduledDate: string | null;
  status: string;
  estimatedCost: number | null;
  actualCost: number | null;
  vendor?: { name: string } | null;
}

interface MaintenanceTicketRecord {
  id: string;
  ticketNumber: string;
  category: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  availableTime: string | null;
  createdAt: string;
  property: {
    id: string;
    name: string;
    code: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
  } | null;
  tenant?: {
    fullName: string;
    phone: string;
  } | null;
  workOrders: WorkOrderRecord[];
}

interface PreventivePlanRecord {
  id: string;
  title: string;
  category: string;
  frequency: string;
  nextDueDate: string;
  status: string;
  property: { name: string };
}

interface PropertyOption {
  id: string;
  name: string;
  units: { id: string; unitNumber: string }[];
}

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<MaintenanceTicketRecord[]>([]);
  const [preventivePlans, setPreventivePlans] = useState<PreventivePlanRecord[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [selectedTicketToUpdate, setSelectedTicketToUpdate] = useState<MaintenanceTicketRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // New Ticket Form
  const [selectedPropId, setSelectedPropId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [category, setCategory] = useState('PLUMBING');
  const [priority, setPriority] = useState('MEDIUM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [availableTime, setAvailableTime] = useState('خلال الفترة المسائية');

  // Update Status / Assign Technician Form
  const [newStatus, setNewStatus] = useState('IN_PROGRESS');
  const [technicianName, setTechnicianName] = useState('خالد الزهراني');
  const [actualCost, setActualCost] = useState('150');
  const [commentText, setCommentText] = useState('تمت المعاينة والبدء في أعمال الإصلاح.');

  const [unauthorized, setUnauthorized] = useState(false);
  const [canCreateTicket, setCanCreateTicket] = useState(true);
  const [canManageTickets, setCanManageTickets] = useState(false);

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
          const isStaff = roles.some((r) =>
            ['ADMIN', 'MAINTENANCE_SUPERVISOR', 'TECHNICIAN', 'PROPERTY_MANAGER'].includes(r)
          );
          setCanCreateTicket(isAdmin || perms.includes('maintenance:create') || roles.includes('TENANT'));
          setCanManageTickets(isStaff || perms.includes('maintenance:assign') || perms.includes('maintenance:close'));
        }
      } catch (e) {
        console.error('Failed to check user permissions:', e);
      }

      const [mRes, pRes] = await Promise.allSettled([
        fetch('/api/maintenance'),
        fetch('/api/properties'),
      ]);

      if (mRes.status === 'fulfilled') {
        if (mRes.value.status === 403) {
          setUnauthorized(true);
        } else if (mRes.value.ok) {
          const mData = await mRes.value.json();
          setTickets(mData.tickets || []);
          setPreventivePlans(mData.preventivePlans || []);
        }
      }

      if (pRes.status === 'fulfilled' && pRes.value.ok) {
        const pData = await pRes.value.json();
        const props = pData.properties || [];
        setProperties(props);

        if (props.length > 0 && !selectedPropId) {
          setSelectedPropId(props[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching maintenance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: selectedPropId,
          unitId: selectedUnitId || undefined,
          category,
          priority,
          title,
          description,
          availableTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'فشل فتح البلاغ');
        return;
      }

      setFormSuccess('تم تسجيل بلاغ الصيانة بنجاح وإشعار فريق العمل!');
      setTitle('');
      setDescription('');
      fetchData();
      setTimeout(() => {
        setIsNewTicketModalOpen(false);
        setFormSuccess(null);
      }, 1000);
    } catch {
      setFormError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketToUpdate) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicketToUpdate.id,
          status: newStatus,
          technicianName,
          actualCost: parseFloat(actualCost) || 0,
          comment: commentText,
        }),
      });

      if (res.ok) {
        fetchData();
        setSelectedTicketToUpdate(null);
      }
    } catch (err) {
      console.error('Error updating ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT': return <Badge variant="danger">عاجل وطارئ</Badge>;
      case 'HIGH': return <Badge variant="warning">أولوية مرتفعة</Badge>;
      case 'MEDIUM': return <Badge variant="info">أولوية متوسطة</Badge>;
      case 'LOW': return <Badge variant="neutral">منخفضة</Badge>;
      default: return <Badge variant="neutral">{p}</Badge>;
    }
  };

  const getCategoryLabel = (c: string) => {
    switch (c) {
      case 'PLUMBING': return 'سباكة ومياه';
      case 'ELECTRICAL': return 'كهرباء وإنارة';
      case 'HVAC': return 'تكييف وتهوية';
      case 'ELEVATORS': return 'مصاعد';
      case 'APPLIANCE': return 'أجهزة منزلية';
      default: return 'صيانة عامة';
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      !search ||
      t.title.includes(search) ||
      t.ticketNumber.includes(search) ||
      t.property.name.includes(search);
    const matchesPriority = !priorityFilter || t.priority === priorityFilter;
    const matchesStatus = !statusFilter || t.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Wrench className="w-6 h-6 text-amber-600" />
              إدارة الصيانة والتشغيل وأوامر العمل
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              متابعة البلاغات الواردة، تكليف الفنيين والموردين، وتوثيق الصيانة الوقائية
            </p>
          </div>

          {canCreateTicket && (
            <button
              onClick={() => {
                setFormError(null);
                setFormSuccess(null);
                setIsNewTicketModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-amber-900/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>فتح بلاغ صيانة جديد</span>
            </button>
          )}
        </div>

        {unauthorized ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ليس لديك صلاحية استعراض بلاغات الصيانة</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              حسابك الحالي لا يمتلك الصلاحية المطلوبة (maintenance:view).
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm"
            >
              <span>العودة للوحة التحكم</span>
            </Link>
          </div>
        ) : (
          <>

        {/* Preventive Maintenance Banner */}
        {preventivePlans.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-amber-900">
                  خطة الصيانة الوقائية القادمة: {preventivePlans[0].title}
                </h3>
                <p className="text-xs text-amber-700">
                  {preventivePlans[0].property.name} • الاستحقاق القادم: {new Date(preventivePlans[0].nextDueDate).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300 self-start sm:self-auto">
              مجدولة آلياً
            </span>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم البلاغ، عنوان المشكلة، أو العقار..."
              className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white"
            >
              <option value="">جميع الأولويات</option>
              <option value="URGENT">عاجل وطارئ</option>
              <option value="HIGH">مرتفع</option>
              <option value="MEDIUM">متوسط</option>
              <option value="LOW">منخفض</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white"
            >
              <option value="">جميع الحالات</option>
              <option value="NEW">جديد</option>
              <option value="IN_PROGRESS">قيد التنفيذ</option>
              <option value="RESOLVED">تم الإصلاح</option>
              <option value="CLOSED">مغلق ومعتمد</option>
            </select>

            <button
              onClick={fetchData}
              className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"
              title="تحديث البلاغات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tickets Cards */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-2 text-slate-400 text-xs sm:text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-600" />
            <span>جاري تحميل بلاغات الصيانة...</span>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">لا توجد بلاغات صيانة مفتوحة</p>
            <p className="text-xs text-slate-400 mt-1">جميع الأصول والوحدات العقارية بحالة تشغيلية ممتازة</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                      {t.ticketNumber}
                    </span>
                    {getPriorityBadge(t.priority)}
                    <Badge variant="neutral">{getCategoryLabel(t.category)}</Badge>
                    <Badge variant={t.status === 'RESOLVED' || t.status === 'CLOSED' ? 'success' : 'warning'}>
                      {t.status === 'NEW' ? 'جديد' : t.status === 'IN_PROGRESS' ? 'قيد المعالجة' : 'منجز'}
                    </Badge>
                  </div>

                  <span className="text-xs text-slate-400">
                    {new Date(t.createdAt).toLocaleString('ar-SA')}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{t.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{t.description}</p>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800">{t.property.name}</span>
                    {t.unit && <span>(وحدة #{t.unit.unitNumber})</span>}
                    {t.tenant && <span>• المستأجر: {t.tenant.fullName}</span>}
                  </div>

                  <div className="flex items-center gap-2">
                    {t.workOrders?.[0] && (
                      <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                        الفني: {t.workOrders[0].technicianName || t.workOrders[0].vendor?.name} (أمر عمل: {t.workOrders[0].orderNumber})
                      </span>
                    )}

                    {canManageTickets && (
                      <button
                        onClick={() => {
                          setSelectedTicketToUpdate(t);
                          setNewStatus(t.status);
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors text-xs"
                      >
                        تحديث الحالة وإسناد أمر عمل
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}

        {/* Modal: Create Maintenance Ticket */}
        <Modal
          isOpen={isNewTicketModalOpen}
          onClose={() => setIsNewTicketModalOpen(false)}
          title="تسجيل بلاغ صيانة جديد"
          description="إبلاغ عن عطل فني في عقار أو وحدة سكنية/تجارية"
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

            <div>
              <label className="block font-bold text-slate-700 mb-1">اختر العقار *</label>
              <select
                required
                value={selectedPropId}
                onChange={(e) => setSelectedPropId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-600 font-bold bg-white text-slate-800"
              >
                <option value="">-- اختر العقار --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                {properties.length === 0 && (
                  <option value="" disabled>
                    لا توجد عقارات مسجلة
                  </option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">تصنيف المشكلة *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-600 font-semibold"
                >
                  <option value="PLUMBING">سباكة وشبكات مياه</option>
                  <option value="ELECTRICAL">كهرباء وإنارة</option>
                  <option value="HVAC">تكييف وتبريد</option>
                  <option value="CARPENTRY">أبواب ونجارة</option>
                  <option value="APPLIANCE">أجهزة ومضخات</option>
                  <option value="GENERAL">صيانة عامة</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">مستوى الأولوية *</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-600 font-bold"
                >
                  <option value="URGENT">عاجل وطارئ (خلال ساعات)</option>
                  <option value="HIGH">مرتفع (خلال 24 ساعة)</option>
                  <option value="MEDIUM">متوسط (خلال 3 أيام)</option>
                  <option value="LOW">منخفض (صيانة اعتيادية)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">عنوان البلاغ *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تسريب مياه في دورة المياه الرئيسية"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-600 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">وصف العطل بالتفصيل *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="صف العطل ومكانه بدقة..."
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewTicketModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                {isSubmitting ? 'جاري الفتح...' : 'تسجيل البلاغ'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Update Ticket Status & Assign Work Order */}
        <Modal
          isOpen={!!selectedTicketToUpdate}
          onClose={() => setSelectedTicketToUpdate(null)}
          title="تحديث حالة البلاغ وتكليف أمر العمل"
          description={selectedTicketToUpdate ? `بلاغ رقم: ${selectedTicketToUpdate.ticketNumber}` : ''}
        >
          <form onSubmit={handleUpdateTicket} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">حالة البلاغ الحالية *</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-600 font-bold"
              >
                <option value="NEW">جديد (قيد المراجعة)</option>
                <option value="IN_PROGRESS">قيد التنفيذ والمباشرة</option>
                <option value="RESOLVED">تم الإصلاح والمعالجة</option>
                <option value="CLOSED">مغلق ومعتمد نهائياً</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الفني / المورد المكلف</label>
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-600 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">التكلفة الفعلية للإصلاح (ر.س)</label>
                <input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-600 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">تقرير العمل وملاحظات الزيارة</label>
              <textarea
                rows={2}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-600"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTicketToUpdate(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
              >
                {isSubmitting ? 'جاري التحديث...' : 'حفظ التحديث وتوثيق العمل'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
