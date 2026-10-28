import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'teal' | 'blue' | 'amber' | 'emerald' | 'purple' | 'slate';
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'teal',
  trend,
}: StatCardProps) {
  const colorMap = {
    teal: {
      bg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      border: 'border-teal-100',
    },
    blue: {
      bg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      border: 'border-sky-100',
    },
    amber: {
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      border: 'border-amber-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      border: 'border-emerald-100',
    },
    purple: {
      bg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      border: 'border-purple-100',
    },
    slate: {
      bg: 'bg-slate-100',
      iconColor: 'text-slate-600',
      border: 'border-slate-200',
    },
  };

  const scheme = colorMap[color];

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-xl sm:text-3xl font-bold text-slate-900 mt-1 tracking-tight break-words">
            {value}
          </h3>
        </div>
        <div className={`p-2.5 sm:p-3 rounded-xl ${scheme.bg} ${scheme.border} border shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${scheme.iconColor}`} />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-xs">
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold shrink-0 ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
