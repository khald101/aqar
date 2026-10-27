'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building,
  Building2,
  DollarSign,
  Activity,
  Percent,
  CheckCircle2,
  Calendar,
  CreditCard,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Badge, StatusBadge } from '@/components/ui/Badge';

export default function OwnerPortalPage() {
  const [data, setData] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOwnerData() {
      try {
        setLoading(true);
        setUnauthorized(false);

        const meRes = await fetch('/api/auth/me');
        if (!isMounted) return;
        if (meRes.ok) {
          const meData = await meRes.json();
          const user = meData.user;
          if (isMounted) setCurrentUser(user);
          const isOwnerOrAdmin = user?.roles?.includes('OWNER') || user?.roles?.includes('ADMIN');
          if (!isOwnerOrAdmin) {
            if (isMounted) {
              setUnauthorized(true);
              setLoading(false);
            }
            return;
          }
        }

        const [propRes, setRes] = await Promise.all([
          fetch('/api/properties'),
          fetch('/api/accounting/settlements'),
        ]);

        if (!isMounted) return;

        if (propRes.ok && setRes.ok) {
          const propData = await propRes.json();
          const setData = await setRes.json();

          const myProperties = propData.properties || [];
          const mySettlements = setData.settlements || [];

          const totalUnits = myProperties.reduce((acc: number, p: any) => acc + (p.unitsCount || 0), 0);
          const rentedUnits = myProperties.reduce((acc: number, p: any) => acc + (p.rentedCount || 0), 0);
          const overallOccupancy = totalUnits > 0 ? Math.round((rentedUnits / totalUnits) * 100) : 0;
          const totalNetPayouts = mySettlements.reduce((acc: number, s: any) => acc + (s.netPayable || 0), 0);

          if (isMounted) {
            setData({
              properties: myProperties,
              settlements: mySettlements,
              totalUnits,
              rentedUnits,
              overallOccupancy,
              totalNetPayouts,
            });
          }
        }
      } catch (err) {
        console.error('Error loading owner portal data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadOwnerData();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center text-slate-400">جاري تحميل بوابة المالك...</div>
      </DashboardLayout>
    );
  }

  if (unauthorized) {
    return (
      <DashboardLayout>
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-xs max-w-lg mx-auto mt-10">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <Building className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">هذه البوابة مخصصة للملاك والمستثمرين فقط</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            حسابك الحالي لا يمتلك صفة مالك عقار مسجل بالنظام.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors shadow-sm"
          >
            <span>العودة للوحة التحكم</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30">
            <Building className="w-3.5 h-3.5" />
            بوابة المالك والمستثمر العقاري — عِمارة
          </div>
          <h1 className="text-xl sm:text-2xl font-black">
            مرحباً بك، {currentUser?.fullName || 'المالك والمستثمر'}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
            متابعة فورية ومباشرة لأداء محفظتك العقارية، نسب الإشغال، والتحصيلات والتسويات المالية
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="العقارات التابعة"
            value={`${data?.properties?.length || 0} عقارات`}
            subtitle="الأصول المسجلة تحت إدارتنا"
            icon={Building2}
            color="emerald"
          />

          <StatCard
            title="نسبة الإشغال الإجمالية"
            value={`${data?.overallOccupancy || 0}%`}
            subtitle={`${data?.rentedUnits} مؤجرة من أصل ${data?.totalUnits} وحدة`}
            icon={Activity}
            color="teal"
            trend={{ value: 'معدل صحي ومستقر', isPositive: true }}
          />

          <StatCard
            title="صافي المستحقات والتسويات"
            value={`${(data?.totalNetPayouts || 0).toLocaleString()} ر.س`}
            subtitle="بعد خصم المصروفات والرسوم الإدارية"
            icon={DollarSign}
            color="blue"
          />

          <StatCard
            title="رسوم إدارة الأملاك"
            value="5.0%"
            subtitle="وفق اتفاقية إدارة الأملاك المعتمدة"
            icon={Percent}
            color="purple"
          />
        </div>

        {/* Owned Properties List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              أداء العقارات التابعة للمالك
            </h3>
            <span className="text-xs text-slate-500 font-semibold">
              {data?.properties?.length} عقارات
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.properties?.map((p: any) => (
              <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {p.code}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">{p.name}</h4>
                    <p className="text-xs text-slate-500">{p.city}، {p.district || p.address}</p>
                  </div>
                  <Badge variant="success">ملكية 100%</Badge>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">نسبة الإشغال</span>
                    <span className="text-emerald-700">{p.occupancyRate}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${p.occupancyRate}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
                    <span>{p.unitsCount} وحدة</span>
                    <span className="text-emerald-700 font-bold">{p.rentedCount} مؤجرة</span>
                    <span className="text-sky-700 font-bold">{p.vacantCount} شاغرة</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Settlements Statement */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              كشف التسويات ومستحقات المالك
            </h3>
            <span className="text-xs text-emerald-700 font-bold">معتمدة ومدققة محاسبياً</span>
          </div>

          <div className="table-responsive-container">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">رقم التسوية</th>
                  <th className="py-2.5 px-3">الفترة الزمنية</th>
                  <th className="py-2.5 px-3">الإيراد الإجمالي</th>
                  <th className="py-2.5 px-3">المصروفات المستقطعة</th>
                  <th className="py-2.5 px-3">رسوم الإدارة (5%)</th>
                  <th className="py-2.5 px-3">صافي المستحق</th>
                  <th className="py-2.5 px-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.settlements?.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-mono font-bold text-teal-800">{s.settlementNumber}</td>
                    <td className="py-3 px-3">
                      {new Date(s.periodStart).toLocaleDateString('ar-SA')} - {new Date(s.periodEnd).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700">{s.totalRevenues.toLocaleString()} ر.س</td>
                    <td className="py-3 px-3 font-bold text-rose-600">({s.totalExpenses.toLocaleString()}) ر.س</td>
                    <td className="py-3 px-3 font-bold text-sky-700">({s.managementFeeAmount.toLocaleString()}) ر.س</td>
                    <td className="py-3 px-3 font-black text-slate-900 text-sm">
                      {s.netPayable.toLocaleString()} ر.س
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="success">معتمدة ومحولة ✓</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
