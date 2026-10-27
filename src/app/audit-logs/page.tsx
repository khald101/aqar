'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Clock,
  ShieldAlert,
  Server,
  User,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Modal } from '@/components/ui/Modal';

interface AuditLogRecord {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    fullName: string;
    email: string;
  } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Log for JSON Detail Inspector
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  const [unauthorized, setUnauthorized] = useState(false);

  const fetchLogs = async (targetPage = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', targetPage.toString());
      params.set('limit', '15');
      if (actionFilter) params.set('action', actionFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (res.status === 403) {
        setUnauthorized(true);
        return;
      }
      if (res.ok) {
        setUnauthorized(false);
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">تسجيل دخول</span>;
      case 'LOGIN_FAILED':
        return <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">فشل دخول</span>;
      case 'LOGOUT':
        return <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">تسجيل خروج</span>;
      case 'CREATE':
        return <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">إنشاء سجل</span>;
      case 'UPDATE':
        return <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">تعديل</span>;
      case 'DELETE':
        return <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">حذف / تعطيل</span>;
      case 'SYSTEM_INIT':
        return <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">تهيئة النظام</span>;
      default:
        return <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">{action}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-sky-600" />
              سجل التدقيق والرقابة على العمليات
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              سجل غير قابل للتعديل يوثق كافة الأنشطة والمستخدمين وتفاصيل العمليات ({totalCount} حركة مسجلة)
            </p>
          </div>
        </div>

        {unauthorized ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4 my-8">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ليس لديك صلاحية استعراض سجل التدقيق</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              حسابك الحالي لا يمتلك الصلاحية المطلوبة (audit:view). هذا القسم مخصص لمدير النظام والرقابة فقط.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm"
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
                placeholder="ابحث بالبريد، الكيان، IP أو التفاصيل..."
                className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition-colors bg-slate-50/50 hover:bg-white"
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
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-sky-600"
            >
              <option value="">جميع أنواع الحركات</option>
              <option value="LOGIN">تسجيل دخول</option>
              <option value="LOGIN_FAILED">فشل تسجيل دخول</option>
              <option value="LOGOUT">تسجيل خروج</option>
              <option value="CREATE">إنشاء سجل</option>
              <option value="UPDATE">تعديل سجل</option>
              <option value="DELETE">حذف سجل</option>
              <option value="SYSTEM_INIT">تهيئة النظام</option>
            </select>

            <button
              onClick={() => {
                setSearch('');
                setActionFilter('');
                setPage(1);
                fetchLogs(1);
              }}
              className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
              title="تحديث السجل"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-xs sm:text-sm text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-sky-600" />
              <span>جاري تحميل سجل العمليات...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">لا توجد سجلات مطابقة</p>
              <p className="text-xs text-slate-400 mt-1">جرّب تغيير معايير البحث أو الفلترة</p>
            </div>
          ) : (
            <div className="table-responsive-container">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                    <th className="py-3 px-4">نوع العملية</th>
                    <th className="py-3 px-4">الكيان / الجدول</th>
                    <th className="py-3 px-4">المستخدم الفاعل</th>
                    <th className="py-3 px-4">عنوان IP</th>
                    <th className="py-3 px-4">التاريخ والوقت</th>
                    <th className="py-3 px-4 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                        <span>{log.entity}</span>
                        {log.entityId && (
                          <span className="block text-[11px] text-slate-400 font-mono font-normal">
                            #{log.entityId.slice(0, 8)}...
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">
                          {log.user?.fullName || log.userEmail || 'نظام آلي'}
                        </div>
                        {log.userEmail && (
                          <span className="block text-[11px] text-slate-400 font-mono">
                            {log.userEmail}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                        {log.ipAddress || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(log.createdAt).toLocaleString('ar-SA')}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
              <div>
                صفحة <span className="font-bold">{page}</span> من <span className="font-bold">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 font-bold disabled:opacity-40"
                >
                  السابق
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 font-bold disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
          </>
        )}

        {/* Audit Details Modal */}
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title="تفاصيل سجل التدقيق والبيانات التقنية"
          description={selectedLog ? `معرف الحركة: ${selectedLog.id}` : ''}
          maxWidth="lg"
        >
          {selectedLog && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-xs">نوع الحركة:</span>
                  <div className="mt-1">{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">الكيان / الجدول:</span>
                  <span className="font-bold text-slate-800">{selectedLog.entity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">المستخدم:</span>
                  <span className="font-semibold text-slate-700">{selectedLog.userEmail || 'نظام آلي'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs">عنوان IP:</span>
                  <span className="font-mono text-slate-700">{selectedLog.ipAddress || 'غير محدد'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-xs">المتصفح ووكيل المستخدم:</span>
                  <span className="font-mono text-[11px] text-slate-600 block break-all mt-0.5">
                    {selectedLog.userAgent || 'غير متوفر'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1.5">
                  حزمة البيانات المسجلة (JSON Payload):
                </span>
                <pre className="p-3 bg-slate-900 text-teal-300 rounded-xl text-xs font-mono overflow-x-auto text-left dir-ltr max-h-60">
                  {selectedLog.details
                    ? JSON.stringify(JSON.parse(selectedLog.details), null, 2)
                    : '// لا توجد بيانات إضافية'}
                </pre>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
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
