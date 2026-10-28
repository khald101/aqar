'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ClipboardList,
  Building2,
  KeyRound,
  FileText,
  CreditCard,
  Wallet,
  Wrench,
  X,
  Building,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { RoleBadge } from '../ui/Badge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    fullName: string;
    email: string;
    roles: string[];
    permissions?: string[];
  } | null;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  highlight?: boolean;
  permissions?: string[];
  roles?: string[];
}

export function Sidebar({ isOpen, onClose, currentUser }: SidebarProps) {
  const pathname = usePathname();

  const canAccess = (permissions?: string[], roles?: string[]) => {
    if (!currentUser) return false;
    // Admin has access to all operational and admin features
    if (currentUser.roles.includes('ADMIN')) return true;

    // Check specific role requirements (e.g. portals)
    if (roles && roles.length > 0) {
      if (!roles.some((r) => currentUser.roles.includes(r))) {
        return false;
      }
    }

    // Check specific permission requirements
    if (permissions && permissions.length > 0) {
      const userPerms = currentUser.permissions || [];
      if (!permissions.some((p) => userPerms.includes(p))) {
        return false;
      }
    }

    return true;
  };

  const isTenant = currentUser?.roles?.includes('TENANT') && !currentUser?.roles?.includes('ADMIN');
  const isOwner = currentUser?.roles?.includes('OWNER') && !currentUser?.roles?.includes('ADMIN');
  const isExternalPortalUser = isTenant || isOwner;

  const allOperationalItems: NavItem[] = [
    {
      title: isTenant
        ? 'بوابة المستأجر الذاتية'
        : isOwner
        ? 'بوابة المالك والمستثمر'
        : 'لوحة التحكم',
      href: isTenant
        ? '/portal/tenant'
        : isOwner
        ? '/portal/owner'
        : '/dashboard',
      icon: isTenant ? KeyRound : isOwner ? Building : LayoutDashboard,
      active: isTenant
        ? pathname.startsWith('/portal/tenant')
        : isOwner
        ? pathname.startsWith('/portal/owner')
        : pathname === '/dashboard',
    },
    ...(!isExternalPortalUser
      ? [
          {
            title: 'العقارات والوحدات',
            href: '/properties',
            icon: Building2,
            active: pathname.startsWith('/properties'),
            permissions: ['properties:view'],
          },
          {
            title: 'عقود الإيجار',
            href: '/contracts',
            icon: FileText,
            active: pathname.startsWith('/contracts'),
            permissions: ['contracts:view'],
          },
          {
            title: 'التحصيلات وسندات القبض',
            href: '/payments',
            icon: CreditCard,
            active: pathname.startsWith('/payments'),
            permissions: ['financial:payments', 'financial:view'],
          },
          {
            title: 'المحاسبة والقيود المزدوجة',
            href: '/accounting',
            icon: Wallet,
            active: pathname.startsWith('/accounting'),
            permissions: ['financial:journal', 'financial:expenses', 'owners:settlements'],
          },
          {
            title: 'الصيانة وأوامر العمل',
            href: '/maintenance',
            icon: Wrench,
            active: pathname.startsWith('/maintenance'),
            permissions: ['maintenance:view'],
          },
          {
            title: 'إدارة الملاك',
            href: '/owners',
            icon: Building,
            active: pathname.startsWith('/owners'),
            permissions: ['owners:view'],
          },
          {
            title: 'المستأجرون',
            href: '/tenants',
            icon: KeyRound,
            active: pathname.startsWith('/tenants'),
            permissions: ['tenants:view'],
          },
        ]
      : []),
  ];

  const allPortalsAndAiItems: NavItem[] = [
    {
      title: 'مستشار الذكاء الاصطناعي',
      href: '/ai-advisor',
      icon: Sparkles,
      active: pathname.startsWith('/ai-advisor'),
      highlight: true,
      permissions: ['ai:insights'],
    },
    ...(!isTenant
      ? [
          {
            title: 'بوابة المستأجر الذاتية',
            href: '/portal/tenant',
            icon: KeyRound,
            active: pathname.startsWith('/portal/tenant'),
            roles: ['TENANT'],
          },
        ]
      : []),
    ...(!isOwner
      ? [
          {
            title: 'بوابة المالك والمستثمر',
            href: '/portal/owner',
            icon: Building,
            active: pathname.startsWith('/portal/owner'),
            roles: ['OWNER'],
          },
        ]
      : []),
  ];

  const allAdminNavItems: NavItem[] = [
    {
      title: 'المستخدمون والحسابات',
      href: '/users',
      icon: Users,
      active: pathname.startsWith('/users'),
      permissions: ['users:view'],
    },
    {
      title: 'مصفوفة الأدوار (RBAC)',
      href: '/roles',
      icon: ShieldCheck,
      active: pathname.startsWith('/roles'),
      permissions: ['roles:view', 'roles:manage'],
    },
    {
      title: 'سجل التدقيق والرقابة',
      href: '/audit-logs',
      icon: ClipboardList,
      active: pathname.startsWith('/audit-logs'),
      permissions: ['audit:view'],
    },
  ];

  const operationalNavItems = allOperationalItems.filter((i) => canAccess(i.permissions, i.roles));
  const portalsAndAiItems = allPortalsAndAiItems.filter((i) => canAccess(i.permissions, i.roles));
  const adminNavItems = allAdminNavItems.filter((i) => canAccess(i.permissions, i.roles));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-slate-900 text-slate-100 flex flex-col border-l border-slate-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white font-black text-xl shadow-md shadow-teal-900/40">
              ع
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">
                عِمارة
              </span>
              <span className="text-xs text-teal-400 font-medium block">
                A'MARAH SYSTEM
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* Operational Modules */}
          {operationalNavItems.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                الوحدات والعمليات اليومية
              </div>
              <nav className="space-y-1">
                {operationalNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onClose()}
                      className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                        item.active
                          ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* AI & Portals */}
          {portalsAndAiItems.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>الذكاء الاصطناعي والبوابات</span>
              </div>
              <nav className="space-y-1">
                {portalsAndAiItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onClose()}
                      className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                        item.active
                          ? 'bg-purple-600 text-white shadow-sm shadow-purple-900/30'
                          : item.highlight
                          ? 'text-purple-300 bg-purple-950/40 border border-purple-800/60 hover:bg-purple-900/60'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0 text-purple-400" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Administration & Security */}
          {adminNavItems.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                الإدارة والرقابة والأمان
              </div>
              <nav className="space-y-1">
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => onClose()}
                      className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                        item.active
                          ? 'bg-slate-800 text-teal-400 border border-slate-700'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Card in Footer */}
        {currentUser && (
          <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-teal-800 text-teal-200 font-bold flex items-center justify-center text-sm shrink-0">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {currentUser.fullName}
                </p>
                <div className="mt-0.5">
                  <RoleBadge roleCode={currentUser.roles[0] || 'ADMIN'} />
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
