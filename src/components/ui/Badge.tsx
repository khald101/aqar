import React from 'react';

type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'
  | 'neutral'
  | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    primary: 'bg-teal-50 text-teal-700 border-teal-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs font-semibold px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}

export function RoleBadge({ roleCode }: { roleCode: string }) {
  const roleConfig: Record<string, { label: string; variant: BadgeVariant }> = {
    ADMIN: { label: 'مدير النظام', variant: 'purple' },
    PROPERTY_MANAGER: { label: 'مدير الأملاك', variant: 'primary' },
    ACCOUNTANT: { label: 'المحاسب', variant: 'info' },
    MAINTENANCE_SUPERVISOR: { label: 'مسؤول الصيانة', variant: 'warning' },
    TECHNICIAN: { label: 'فني ميداني', variant: 'neutral' },
    OWNER: { label: 'مالك عقار', variant: 'success' },
    TENANT: { label: 'مستأجر', variant: 'neutral' },
  };

  const config = roleConfig[roleCode] || { label: roleCode, variant: 'neutral' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: BadgeVariant }> = {
    ACTIVE: { label: 'نشط', variant: 'success' },
    INACTIVE: { label: 'غير نشط', variant: 'neutral' },
    SUSPENDED: { label: 'موقوف', variant: 'danger' },
    RENTED: { label: 'مؤجرة', variant: 'success' },
    VACANT: { label: 'شاغرة', variant: 'info' },
    MAINTENANCE: { label: 'تحت الصيانة', variant: 'warning' },
    RESERVED: { label: 'محجوزة', variant: 'purple' },
  };

  const config = statusConfig[status] || { label: status, variant: 'neutral' };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
