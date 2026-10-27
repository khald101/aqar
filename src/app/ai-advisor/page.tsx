'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Sliders,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Building2,
  DollarSign,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';

interface SimulationMetrics {
  propertiesCount: number;
  unitsCount: number;
  rentedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  totalContractedRent: number;
  totalCollected: number;
  pendingReceivables: number;
  totalExpenses: number;
  netOperatingIncome: number;
  collectionEfficiency: number;
  simulatedRentIncrease: number;
  projectedAnnualRevenue: number;
  deltaPercentage: number;
}

export default function AiAdvisorPage() {
  const [metrics, setMetrics] = useState<SimulationMetrics | null>(null);
  const [findings, setFindings] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  // Simulation controls
  const [deltaPercentage, setDeltaPercentage] = useState<number>(5);
  const [simulationType, setSimulationType] = useState<string>('RENT_INCREASE');
  const [customQuery, setCustomQuery] = useState('تحليل كفاءة التحصيل واستشراف التدفقات النقدية');

  const runSimulation = async (delta = deltaPercentage, type = simulationType, query = customQuery) => {
    try {
      setSimulating(true);
      const res = await fetch('/api/ai/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          simulationType: type,
          deltaPercentage: delta,
        }),
      });

      if (res.status === 403) {
        setUnauthorized(true);
        return;
      }

      if (res.ok) {
        setUnauthorized(false);
        const data = await res.json();
        setMetrics(data.metricsSnapshot);
        setFindings(data.insight.findings);
        setSummary(data.insight.summary);
      }
    } catch (err) {
      console.error('Error running AI simulation:', err);
    } finally {
      setSimulating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-3 border border-purple-500/30">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              مستشار الذكاء الاصطناعي ومحاكي القرارات العقارية
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              تحليل الأداء واستشراف سيناريوهات الإيرادات
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              محرك حسابي موثوق يستخرج الأرقام الفعلية من قاعدة البيانات دون اختلاق، ويقدم محاكاة دقيقة لقرارات التسعير والإشغال.
            </p>
          </div>
        </div>

        {unauthorized ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-4 my-8">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ليس لديك صلاحية الوصول لمستشار الذكاء الاصطناعي</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              حسابك الحالي لا يمتلك الصلاحية المطلوبة (ai:insights). هذه الميزة مخصصة للإدارة العليا ومدراء الأملاك.
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
            {/* Ground-Truth Real KPIs from Database */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="الإيراد التعاقدي الإجمالي"
            value={metrics ? `${metrics.totalContractedRent.toLocaleString()} ر.س` : '...'}
            subtitle="القيمة السنوية لكافة العقود النشطة"
            icon={Building2}
            color="teal"
          />

          <StatCard
            title="المحصل نقداً فعلياً"
            value={metrics ? `${metrics.totalCollected.toLocaleString()} ر.س` : '...'}
            subtitle={`كفاءة تحصيل ${metrics?.collectionEfficiency || 0}%`}
            icon={DollarSign}
            color="emerald"
            trend={metrics ? { value: `${metrics.collectionEfficiency}% محصل`, isPositive: true } : undefined}
          />

          <StatCard
            title="صافي الدخل التشغيلي (NOI)"
            value={metrics ? `${metrics.netOperatingIncome.toLocaleString()} ر.س` : '...'}
            subtitle={metrics ? `بعد خصم المصروفات (${metrics.totalExpenses.toLocaleString()} ر.س)` : '...'}
            icon={TrendingUp}
            color="blue"
          />

          <StatCard
            title="نسبة الإشغال الفعلية"
            value={metrics ? `${metrics.occupancyRate}%` : '...'}
            subtitle={`${metrics?.rentedUnits} مؤجرة من ${metrics?.unitsCount} وحدات`}
            icon={Activity}
            color="purple"
          />
        </div>

        {/* Interactive Simulation Controls */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                محاكي قرارات التسعير والتدفقات النقدية
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                اختبر أثر زيادة الإيجارات أو تقليص الشواغر على صافي دخل المحفظة
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => runSimulation(deltaPercentage, simulationType, customQuery)}
                disabled={simulating}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors disabled:opacity-60"
              >
                {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>إعادة المحاكاة</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع المحاكاة</label>
              <select
                value={simulationType}
                onChange={(e) => {
                  setSimulationType(e.target.value);
                  runSimulation(deltaPercentage, e.target.value, customQuery);
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50"
              >
                <option value="RENT_INCREASE">تعديل أسعار الإيجار (زيادة نسبية)</option>
                <option value="OCCUPANCY_OPTIMIZATION">تأجير الوحدات الشاغرة (إشغال 100%)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span>نسبة التعديل التقديرية</span>
                <span className="text-purple-700 font-mono">+{deltaPercentage}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={deltaPercentage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setDeltaPercentage(val);
                  runSimulation(val, simulationType, customQuery);
                }}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">موضوع الاستشارة والتحليل</label>
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Simulation Outcome Highlight Box */}
          {metrics && (
            <div className="bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-purple-900 block mb-1">
                  الأثر المالي المتوقع للقرار:
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  +{metrics.simulatedRentIncrease.toLocaleString()} ريال إضافي سنوياً
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  سيرتفع الإيراد السنوي التقديري من {metrics.totalContractedRent.toLocaleString()} ر.س إلى{' '}
                  <span className="font-bold text-purple-800 font-mono">
                    {metrics.projectedAnnualRevenue.toLocaleString()} ر.س
                  </span>
                </p>
              </div>

              <div className="bg-white px-4 py-3 rounded-xl border border-purple-200 text-xs space-y-1 shrink-0">
                <div className="flex justify-between gap-4 text-slate-500">
                  <span>مصدر البيانات:</span>
                  <span className="font-semibold text-slate-800">قاعدة بيانات عِمارة الحية</span>
                </div>
                <div className="flex justify-between gap-4 text-slate-500">
                  <span>نوع النتيجة:</span>
                  <span className="font-semibold text-purple-700">توقعات استشرافية دقيقة</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Analytical Findings & Action Plan */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              التقرير التفسيري والتوصيات الإدارية
            </h3>
          </div>

          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-200/60 font-medium">
            {findings || 'جاري استخراج التقرير التحليلي...'}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              تلتزم الخوارزمية بالبيانات الحقيقية ولا تولد أرقاماً عشوائية.
            </span>
            <span className="font-semibold text-purple-700">مدعوم بمحرك عِمارة للتحليل</span>
          </div>
        </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
