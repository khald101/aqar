'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Home,
  MapPin,
  FileText,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface UnitRecord {
  id: string;
  unitNumber: string;
  floor: number | null;
  type: string;
  areaSqM: number | null;
  rooms: number | null;
  bathrooms: number | null;
  yearlyRent: number | null;
  status: string;
  property: {
    id: string;
    name: string;
    code: string;
  };
  contracts?: {
    tenant: {
      fullName: string;
    };
  }[];
}

interface PropertyRecord {
  id: string;
  code: string;
  name: string;
  type: string;
  address: string;
  city: string;
  district: string | null;
  deedNumber: string | null;
  unitsCount: number;
  rentedCount: number;
  vacantCount: number;
  occupancyRate: number;
  ownerships: {
    sharePercentage: number;
    owner: {
      name: string;
    };
  }[];
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'properties' | 'units'>('properties');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // New Property Form
  const [propName, setPropName] = useState('');
  const [propCode, setPropCode] = useState('');
  const [propType, setPropType] = useState('MIXED');
  const [propCity, setPropCity] = useState('الرياض');
  const [propDistrict, setPropDistrict] = useState('');
  const [propAddress, setPropAddress] = useState('');
  const [propDeed, setPropDeed] = useState('');

  // New Unit Form
  const [unitPropId, setUnitPropId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitFloor, setUnitFloor] = useState('1');
  const [unitType, setUnitType] = useState('APARTMENT');
  const [unitArea, setUnitArea] = useState('120');
  const [unitRooms, setUnitRooms] = useState('3');
  const [unitBaths, setUnitBaths] = useState('2');
  const [unitRent, setUnitRent] = useState('45000');

  const [unauthorized, setUnauthorized] = useState(false);
  const [canCreateProperty, setCanCreateProperty] = useState(true);
  const [canCreateUnit, setCanCreateUnit] = useState(true);

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
          const isManager = roles.includes('PROPERTY_MANAGER');
          setCanCreateProperty(isAdmin || isManager || perms.includes('properties:create'));
          setCanCreateUnit(isAdmin || isManager || perms.includes('units:create'));
        }
      } catch (e) {
        console.error('Failed to check user permissions:', e);
      }

      const [propRes, unitRes] = await Promise.allSettled([
        fetch('/api/properties'),
        fetch('/api/units'),
      ]);

      if (propRes.status === 'fulfilled') {
        if (propRes.value.status === 403) {
          setUnauthorized(true);
        } else if (propRes.value.ok) {
          const propData = await propRes.value.json();
          const props = propData.properties || [];
          setProperties(props);
          if (props.length > 0 && !unitPropId) {
            setUnitPropId(props[0].id);
          }
        }
      }

      if (unitRes.status === 'fulfilled' && unitRes.value.ok) {
        const unitData = await unitRes.value.json();
        setUnits(unitData.units || []);
      }
    } catch (err) {
      console.error('Error fetching properties and units:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: propName,
          code: propCode,
          type: propType,
          city: propCity,
          district: propDistrict,
          address: propAddress,
          deedNumber: propDeed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'حدث خطأ أثناء إضافة العقار');
        return;
      }

      setFormSuccess('تم حفظ وتسجيل الأصل العقاري بنجاح!');
      setPropName('');
      setPropCode('');
      fetchData();
      setTimeout(() => {
        setIsPropertyModalOpen(false);
        setFormSuccess(null);
      }, 1000);
    } catch {
      setFormError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: unitPropId,
          unitNumber,
          floor: unitFloor,
          type: unitType,
          areaSqM: unitArea,
          rooms: unitRooms,
          bathrooms: unitBaths,
          yearlyRent: unitRent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'حدث خطأ أثناء إضافة الوحدة');
        return;
      }

      setFormSuccess('تم تسجيل الوحدة العقارية بنجاح!');
      setUnitNumber('');
      fetchData();
      setTimeout(() => {
        setIsUnitModalOpen(false);
        setFormSuccess(null);
      }, 1000);
    } catch {
      setFormError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.includes(search) ||
      p.code.includes(search) ||
      p.city.includes(search);
    const matchesType = !selectedType || p.type === selectedType;
    return matchesSearch && matchesType;
  });

  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      !search ||
      u.unitNumber.includes(search) ||
      u.property.name.includes(search);
    const matchesStatus = !selectedStatus || u.status === selectedStatus;
    const matchesType = !selectedType || u.type === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-teal-600" />
              إدارة الأصول العقارية والوحدات
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              إدارة المحفظة العقارية، المباني، الوحدات السكنية والتجارية، والملاك ونسب الإشغال
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canCreateProperty && (
              <button
                onClick={() => {
                  setFormError(null);
                  setFormSuccess(null);
                  if (!propCode) setPropCode(`PROP-${Math.floor(100 + Math.random() * 900)}`);
                  setIsPropertyModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-900/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة عقار</span>
              </button>
            )}

            {canCreateUnit && (
              <button
                onClick={() => {
                  setFormError(null);
                  setFormSuccess(null);
                  setIsUnitModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة وحدة</span>
              </button>
            )}
          </div>
        </div>

        {unauthorized ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ليس لديك صلاحية استعراض العقارات والوحدات</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              حسابك الحالي لا يمتلك الصلاحية المطلوبة (properties:view أو units:view).
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
            {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('properties')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'properties'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>العقارات والمباني ({properties.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('units')}
            className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'units'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>الوحدات العقارية ({units.length})</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم العقار، الكود، المدينة، أو رقم الوحدة..."
              className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-teal-600"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTab === 'units' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white"
              >
                <option value="">جميع الحالات</option>
                <option value="RENTED">مؤجرة</option>
                <option value="VACANT">شاغرة</option>
                <option value="MAINTENANCE">تحت الصيانة</option>
              </select>
            )}

            <button
              onClick={fetchData}
              className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content: Properties Cards or Units Table */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-2 text-slate-400 text-xs sm:text-sm">
            <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
            <span>جاري تحميل بيانات الأصول العقارية...</span>
          </div>
        ) : activeTab === 'properties' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xs font-mono text-teal-600 bg-teal-50 px-2 py-0.5 rounded font-bold">
                        {p.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {p.name}
                      </h3>
                    </div>
                    <Badge variant={p.type === 'MIXED' ? 'purple' : 'primary'}>
                      {p.type === 'MIXED' ? 'متعدد الاستخدام' : p.type === 'COMMERCIAL' ? 'تجاري' : 'سكني'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 my-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.city}، {p.district || p.address}</span>
                    </div>
                    {p.deedNumber && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>رقم الصك: {p.deedNumber}</span>
                      </div>
                    )}
                    {p.ownerships?.[0] && (
                      <div className="text-[11px] text-slate-600 font-semibold pt-1">
                        المالك: {p.ownerships[0].owner.name} ({p.ownerships[0].sharePercentage}%)
                      </div>
                    )}
                  </div>
                </div>

                {/* Occupancy Progress */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-600">نسبة الإشغال</span>
                    <span className="text-teal-700">{p.occupancyRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${p.occupancyRate}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
                    <span>{p.unitsCount} وحدات إجمالية</span>
                    <span className="text-emerald-600 font-bold">{p.rentedCount} مؤجرة</span>
                    <span className="text-sky-600 font-bold">{p.vacantCount} شاغرة</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Units Table */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="table-responsive-container">
              <table className="w-full text-right text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold">
                    <th className="py-3 px-4">رقم الوحدة</th>
                    <th className="py-3 px-4">العقار</th>
                    <th className="py-3 px-4">النوع والطابق</th>
                    <th className="py-3 px-4">المساحة</th>
                    <th className="py-3 px-4">الإيجار السنوي</th>
                    <th className="py-3 px-4">المستأجر الحالي</th>
                    <th className="py-3 px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUnits.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <span className="font-mono text-sm">#{u.unitNumber}</span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {u.property.name}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <span>{u.type === 'APARTMENT' ? 'شقة' : u.type === 'OFFICE' ? 'مكتب' : 'محل'}</span>
                        <span className="text-slate-400 mr-1.5">(طابق {u.floor ?? 0})</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-mono">
                        {u.areaSqM ? `${u.areaSqM} م²` : '—'}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {u.yearlyRent ? `${u.yearlyRent.toLocaleString()} ر.س` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                        {u.contracts?.[0]?.tenant?.fullName ? (
                          <span className="font-semibold text-teal-800">
                            {u.contracts[0].tenant.fullName}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={u.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
        )}

        {/* Modal: Create Property */}
        <Modal
          isOpen={isPropertyModalOpen}
          onClose={() => setIsPropertyModalOpen(false)}
          title="تسجيل أصل عقاري جديد"
          description="إضافة عقار أو مبنى سكني أو تجاري إلى المحفظة"
        >
          <form onSubmit={handleCreateProperty} className="space-y-4 text-xs sm:text-sm">
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
              <label className="block font-bold text-slate-700 mb-1">اسم العقار *</label>
              <input
                type="text"
                required
                value={propName}
                onChange={(e) => setPropName(e.target.value)}
                placeholder="مثال: برج اليمامة التجاري"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">رمز العقار الفريد *</label>
                <input
                  type="text"
                  required
                  value={propCode}
                  onChange={(e) => setPropCode(e.target.value)}
                  placeholder="PROP-RYD-003"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">النوع *</label>
                <select
                  value={propType}
                  onChange={(e) => setPropType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold"
                >
                  <option value="RESIDENTIAL">سكني</option>
                  <option value="COMMERCIAL">تجاري</option>
                  <option value="MIXED">متعدد الاستخدام</option>
                  <option value="WAREHOUSE">مستودع</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المدينة *</label>
                <input
                  type="text"
                  required
                  value={propCity}
                  onChange={(e) => setPropCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الحي</label>
                <input
                  type="text"
                  value={propDistrict}
                  onChange={(e) => setPropDistrict(e.target.value)}
                  placeholder="مثال: النرجس"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">العنوان بالتفصيل</label>
              <input
                type="text"
                value={propAddress}
                onChange={(e) => setPropAddress(e.target.value)}
                placeholder="طريق عثمان بن عفان، تقاطع أنس بن مالك"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">رقم الصك العقاري</label>
              <input
                type="text"
                value={propDeed}
                onChange={(e) => setPropDeed(e.target.value)}
                placeholder="31010900XXXX"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPropertyModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-60"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'تسجيل العقار'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Create Unit */}
        <Modal
          isOpen={isUnitModalOpen}
          onClose={() => setIsUnitModalOpen(false)}
          title="إضافة وحدة عقارية"
          description="تسجيل شقة أو مكتب أو محل ضمن عقار مسجل"
        >
          <form onSubmit={handleCreateUnit} className="space-y-4 text-xs sm:text-sm">
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
              <label className="block font-bold text-slate-700 mb-1">اختر العقار التابع له *</label>
              <select
                required
                value={unitPropId}
                onChange={(e) => setUnitPropId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-bold bg-white text-slate-800"
              >
                <option value="">-- اختر العقار التابع له --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
                {properties.length === 0 && (
                  <option value="" disabled>
                    لا توجد عقارات مسجلة
                  </option>
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الوحدة *</label>
                <input
                  type="text"
                  required
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  placeholder="مثال: 302"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع الوحدة *</label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-semibold"
                >
                  <option value="APARTMENT">شقة سكنية</option>
                  <option value="OFFICE">مكتب إداري</option>
                  <option value="SHOP">محل تجاري</option>
                  <option value="VILLA">فيلا</option>
                  <option value="WAREHOUSE">مستودع</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الطابق</label>
                <input
                  type="number"
                  value={unitFloor}
                  onChange={(e) => setUnitFloor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المساحة (م²)</label>
                <input
                  type="number"
                  value={unitArea}
                  onChange={(e) => setUnitArea(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الإيجار السنوي (ر.س)</label>
                <input
                  type="number"
                  value={unitRent}
                  onChange={(e) => setUnitRent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-600 font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsUnitModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-60"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'إضافة الوحدة'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
