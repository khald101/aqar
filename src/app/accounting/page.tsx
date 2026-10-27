'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  Search,
  RefreshCw,
  Scale,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Building,
  DollarSign,
  ArrowDownUp,
  Percent,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface AccountRecord {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  type: string;
  balance: number;
}

interface JournalLineRecord {
  id: string;
  debit: number;
  credit: number;
  description: string | null;
  account: {
    code: string;
    nameAr: string;
  };
}

interface JournalEntryRecord {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  lines: JournalLineRecord[];
}

interface ExpenseRecord {
  id: string;
  expenseNumber: string;
  category: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  expenseDate: string;
  status: string;
  description: string;
  property?: { name: string } | null;
  vendor?: { name: string } | null;
}

interface OwnerSettlementRecord {
  id: string;
  settlementNumber: string;
  periodStart: string;
  periodEnd: string;
  totalRevenues: number;
  totalExpenses: number;
  managementFeeRate: number;
  managementFeeAmount: number;
  netPayable: number;
  status: string;
  owner: {
    name: string;
    phone: string;
    bankName: string | null;
    iban: string | null;
  };
}

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<'journal' | 'accounts' | 'expenses' | 'settlements'>('journal');
  const [entries, setEntries] = useState<JournalEntryRecord[]>([]);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [settlements, setSettlements] = useState<OwnerSettlementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // New Journal Entry Form State
  const [jeDescription, setJeDescription] = useState('إثبات استحقاق إيجار وتحصيل');
  const [debitAccountId, setDebitAccountId] = useState('');
  const [debitAmount, setDebitAmount] = useState('10000');
  const [creditAccountId, setCreditAccountId] = useState('');
  const [creditAmount, setCreditAmount] = useState('10000');

  // New Expense Form State
  const [expCategory, setExpCategory] = useState('MAINTENANCE');
  const [expAmount, setExpAmount] = useState('1200');
  const [expTax, setExpTax] = useState('180');
  const [expDescription, setExpDescription] = useState('صيانة إنارة الممرات واستبدال لمبات LED');

  const [unauthorized, setUnauthorized] = useState(false);
  const [canCreateJournal, setCanCreateJournal] = useState(true);
  const [canCreateExpense, setCanCreateExpense] = useState(true);

  const fetchAccountingData = async () => {
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
          setCanCreateJournal(isAdmin || perms.includes('financial:journal'));
          setCanCreateExpense(isAdmin || perms.includes('financial:expenses'));
        }
      } catch (e) {
        console.error('Failed to check user permissions:', e);
      }

      const [jeRes, expRes, setRes] = await Promise.allSettled([
        fetch('/api/accounting/journal'),
        fetch('/api/accounting/expenses'),
        fetch('/api/accounting/settlements'),
      ]);

      if (jeRes.status === 'fulfilled') {
        if (jeRes.value.status === 403) {
          setUnauthorized(true);
        } else if (jeRes.value.ok) {
          const jeData = await jeRes.value.json();
          setEntries(jeData.entries || []);
          const accs = jeData.accounts || [];
          setAccounts(accs);
          if (accs.length >= 2) {
            if (!debitAccountId) setDebitAccountId(accs[0].id);
            if (!creditAccountId) setCreditAccountId(accs[1].id);
          }
        }
      }

      if (expRes.status === 'fulfilled' && expRes.value.ok) {
        const expData = await expRes.value.json();
        setExpenses(expData.expenses || []);
      }

      if (setRes.status === 'fulfilled' && setRes.value.ok) {
        const setData = await setRes.value.json();
        setSettlements(setData.settlements || []);
      }
    } catch (err) {
      console.error('Error fetching accounting data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const handlePostJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const dVal = parseFloat(debitAmount) || 0;
    const cVal = parseFloat(creditAmount) || 0;

    if (dVal !== cVal) {
      setFormError(`القيد غير متوازن! إجمالي المدين (${dVal}) يجب أن يساوي إجمالي الدائن (${cVal})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/accounting/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: jeDescription,
          lines: [
            { accountId: debitAccountId, debit: dVal, credit: 0, description: 'طرف مدين' },
            { accountId: creditAccountId, debit: 0, credit: cVal, description: 'طرف دائن' },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'فشل ترحيل القيد');
        return;
      }

      setFormSuccess('تم ترحيل القيد المحاسبي المتوازن بنجاح!');
      fetchAccountingData();
      setTimeout(() => {
        setIsJournalModalOpen(false);
        setFormSuccess(null);
      }, 1000);
    } catch {
      setFormError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/accounting/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expCategory,
          amount: parseFloat(expAmount),
          taxAmount: parseFloat(expTax),
          description: expDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'فشل تسجيل المصروف');
        return;
      }

      setFormSuccess('تم تسجيل سند الصرف بنجاح!');
      fetchAccountingData();
      setTimeout(() => {
        setIsExpenseModalOpen(false);
        setFormSuccess(null);
      }, 1000);
    } catch {
      setFormError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBalanced = parseFloat(debitAmount) === parseFloat(creditAmount) && parseFloat(debitAmount) > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-sky-600" />
              المحاسبة والإدارة المالية والتسويات
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              دليل الحسابات، القيود المزدوجة المتوازنة، المصروفات التشغيلية، واحتساب تسويات الملاك
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canCreateJournal && (
              <button
                onClick={() => {
                  setFormError(null);
                  setFormSuccess(null);
                  setIsJournalModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-purple-900/10 transition-colors"
              >
                <Scale className="w-4 h-4" />
                <span>إدخال قيد محاسبي</span>
              </button>
            )}

            {canCreateExpense && (
              <button
                onClick={() => {
                  setFormError(null);
                  setFormSuccess(null);
                  setIsExpenseModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>تسجيل مصروف</span>
              </button>
            )}
          </div>
        </div>

        {unauthorized ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ليس لديك صلاحية استعراض الحركات والقيود المحاسبية</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              حسابك الحالي لا يمتلك الصلاحية المطلوبة (financial:journal أو financial:expenses).
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
            {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('journal')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'journal'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>القيود المزدوجة المتوازنة ({entries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>دليل الحسابات ({accounts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>المصروفات وسندات الصرف ({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settlements')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settlements'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>تسويات الملاك ({settlements.length})</span>
          </button>
        </div>

        {/* Tab 1: Journal Entries */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-2 text-slate-400 text-xs sm:text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
            <span>جاري تحميل البيانات المالية...</span>
          </div>
        ) : activeTab === 'journal' ? (
          <div className="space-y-4">
            <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 flex items-center justify-between text-xs sm:text-sm text-purple-900 font-semibold">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                نظام القيد المزدوج مفعل: يتم التحقق آلياً من توازن إجمالي المدين والدائن في كل قيد.
              </span>
              <span className="font-bold font-mono">Debit === Credit</span>
            </div>

            {entries.map((je) => (
              <div
                key={je.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {je.entryNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {je.description}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">
                      {new Date(je.entryDate).toLocaleDateString('ar-SA')}
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      متوازن: {je.totalDebit.toLocaleString()} ر.س
                    </span>
                  </div>
                </div>

                {/* Journal Lines Table */}
                <div className="table-responsive-container">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="text-slate-400 font-semibold border-b border-slate-100">
                        <th className="py-2 px-3">كود الحساب واسمه</th>
                        <th className="py-2 px-3">البيان</th>
                        <th className="py-2 px-3 text-left">مدين (Debit)</th>
                        <th className="py-2 px-3 text-left">دائن (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {je.lines.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            <span className="font-mono text-purple-700 mr-1.5">[{l.account.code}]</span>
                            <span>{l.account.nameAr}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{l.description || '—'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700 text-left">
                            {l.debit > 0 ? `${l.debit.toLocaleString()} ر.س` : '—'}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-700 text-left">
                            {l.credit > 0 ? `${l.credit.toLocaleString()} ر.س` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'accounts' ? (
          /* Tab 2: Chart of Accounts */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="table-responsive-container">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                    <th className="py-3 px-4">كود الحساب</th>
                    <th className="py-3 px-4">اسم الحساب بالعربية</th>
                    <th className="py-3 px-4">الاسم بالإنجليزية</th>
                    <th className="py-3 px-4">نوع الحساب</th>
                    <th className="py-3 px-4 text-left">الرصيد الدفتري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {accounts.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-purple-700">{a.code}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{a.nameAr}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{a.nameEn}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={a.type === 'ASSET' ? 'primary' : a.type === 'REVENUE' ? 'success' : 'neutral'}>
                          {a.type}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-left">
                        {a.balance.toLocaleString()} ر.س
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'expenses' ? (
          /* Tab 3: Expenses */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="table-responsive-container">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                    <th className="py-3 px-4">رقم السند</th>
                    <th className="py-3 px-4">التصنيف</th>
                    <th className="py-3 px-4">البيان</th>
                    <th className="py-3 px-4">العقار / المورد</th>
                    <th className="py-3 px-4">المبلغ بدون ضريبة</th>
                    <th className="py-3 px-4">الضريبة (15%)</th>
                    <th className="py-3 px-4">الإجمالي الشامل</th>
                    <th className="py-3 px-4">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{e.expenseNumber}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <Badge variant="warning">{e.category}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{e.description}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {e.property?.name || e.vendor?.name || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">{e.amount.toLocaleString()} ر.س</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{e.taxAmount.toLocaleString()} ر.س</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-700">
                        {e.totalAmount.toLocaleString()} ر.س
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {new Date(e.expenseDate).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Tab 4: Owner Settlements */
          <div className="space-y-4">
            {settlements.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {s.settlementNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      المالك: {s.owner.name}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500">
                    الفترة: {new Date(s.periodStart).toLocaleDateString('ar-SA')} إلى {new Date(s.periodEnd).toLocaleDateString('ar-SA')}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-400 block">إجمالي الإيرادات المحصلة:</span>
                    <span className="text-sm font-bold text-emerald-700">{s.totalRevenues.toLocaleString()} ر.س</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">المصروفات المستقطعة:</span>
                    <span className="text-sm font-bold text-rose-600">({s.totalExpenses.toLocaleString()}) ر.س</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">رسوم إدارة الأملاك ({s.managementFeeRate}%):</span>
                    <span className="text-sm font-bold text-sky-700">({s.managementFeeAmount.toLocaleString()}) ر.س</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">صافي مستحقات المالك:</span>
                    <span className="text-base font-black text-slate-900">{s.netPayable.toLocaleString()} ر.س</span>
                  </div>
                </div>

                {s.owner.iban && (
                  <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                    <span>الحساب البنكي: {s.owner.bankName}</span>
                    <span className="font-mono">{s.owner.iban}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </>
        )}

        {/* Modal: New Journal Entry */}
        <Modal
          isOpen={isJournalModalOpen}
          onClose={() => setIsJournalModalOpen(false)}
          title="تسجيل قيد محاسبي مزدوج (Debit = Credit)"
          description="إدخال قيود محاسبية متوازنة تحدّث أرصدة دليل الحسابات فورياً"
        >
          <form onSubmit={handlePostJournalEntry} className="space-y-4 text-xs sm:text-sm">
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
              <label className="block font-bold text-slate-700 mb-1">البيان التوضيحي للقيد *</label>
              <input
                type="text"
                required
                value={jeDescription}
                onChange={(e) => setJeDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-600 font-semibold"
              />
            </div>

            {/* Debit Side */}
            <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
              <span className="font-bold text-emerald-800 block text-xs">الطرف المدين (Debit)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">الحساب المدين *</label>
                  <select
                    value={debitAccountId}
                    onChange={(e) => setDebitAccountId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-bold"
                  >
                    <option value="">-- اختر الحساب المدين --</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.code}] {a.nameAr}
                      </option>
                    ))}
                    {accounts.length === 0 && (
                      <option value="" disabled>لا توجد حسابات مسجلة</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">المبلغ المدين (ر.س)</label>
                  <input
                    type="number"
                    required
                    value={debitAmount}
                    onChange={(e) => setDebitAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Credit Side */}
            <div className="p-3.5 bg-sky-50/50 rounded-xl border border-sky-200/80 space-y-2">
              <span className="font-bold text-sky-800 block text-xs">الطرف الدائن (Credit)</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">الحساب الدائن *</label>
                  <select
                    value={creditAccountId}
                    onChange={(e) => setCreditAccountId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 font-bold"
                  >
                    <option value="">-- اختر الحساب الدائن --</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.code}] {a.nameAr}
                      </option>
                    ))}
                    {accounts.length === 0 && (
                      <option value="" disabled>لا توجد حسابات مسجلة</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">المبلغ الدائن (ر.س)</label>
                  <input
                    type="number"
                    required
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Balance Verification Pill */}
            <div className="flex items-center justify-between text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50">
              <span>حالة توازن القيد:</span>
              <span className={isBalanced ? 'text-emerald-600' : 'text-rose-600'}>
                {isBalanced ? '✓ القيد متوازن بدقة' : '✗ القيد غير متوازن (المدين != الدائن)'}
              </span>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsJournalModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isBalanced}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الترحيل...' : 'ترحيل القيد الدفتري'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: New Expense */}
        <Modal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          title="تسجيل مصروف وسند صرف"
          description="تسجيل تكاليف الصيانة أو الخدمات والمشتريات"
        >
          <form onSubmit={handleCreateExpense} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 mb-1">تصنيف المصروف *</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 font-bold"
              >
                <option value="MAINTENANCE">صيانة وتشغيل</option>
                <option value="UTILITIES">فواتير ومرافق (كهرباء/مياه)</option>
                <option value="MANAGEMENT_FEE">رسوم إدارية</option>
                <option value="INSURANCE">تأمين</option>
                <option value="OTHER">مصروفات أخرى</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المبلغ الأساسي (ر.س) *</label>
                <input
                  type="number"
                  required
                  value={expAmount}
                  onChange={(e) => {
                    setExpAmount(e.target.value);
                    setExpTax((parseFloat(e.target.value || '0') * 0.15).toFixed(2));
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ضريبة القيمة المضافة (15%)</label>
                <input
                  type="number"
                  value={expTax}
                  onChange={(e) => setExpTax(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">البيان والشرح *</label>
              <textarea
                rows={2}
                required
                value={expDescription}
                onChange={(e) => setExpDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'تسجيل سند الصرف'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
