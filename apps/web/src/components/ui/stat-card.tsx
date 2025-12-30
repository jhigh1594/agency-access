/**
 * Stat Card Component
 *
 * Displays a single statistic with icon and styling.
 * Used in dashboard grids and analytics views.
 */

import type { LucideIcon } from 'lucide-react';

const COLOR_CLASSES: Record<
  'slate' | 'emerald' | 'yellow' | 'red' | 'indigo' | 'blue',
  { bg: string; text: string; iconBg: string; iconText: string }
> = {
  slate: {
    bg: 'bg-white',
    text: 'text-slate-900',
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
  },
  emerald: {
    bg: 'bg-white',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
  },
  yellow: {
    bg: 'bg-white',
    text: 'text-yellow-700',
    iconBg: 'bg-yellow-100',
    iconText: 'text-yellow-600',
  },
  red: {
    bg: 'bg-white',
    text: 'text-red-700',
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
  },
  indigo: {
    bg: 'bg-white',
    text: 'text-slate-900',
    iconBg: 'bg-indigo-50',
    iconText: 'text-indigo-600',
  },
  blue: {
    bg: 'bg-white',
    text: 'text-slate-900',
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
  },
};

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color?: keyof typeof COLOR_CLASSES;
  trend?: {
    value: number;
    label: string;
  };
}

export function StatCard({
  label,
  value,
  icon,
  color = 'slate',
  trend,
}: StatCardProps) {
  const classes = COLOR_CLASSES[color];

  return (
    <div className={`${classes.bg} rounded-xl shadow-sm border border-slate-200 p-6`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium text-slate-600`}>{label}</span>
        <div className={`p-2 rounded-lg ${classes.iconBg} ${classes.iconText}`}>
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-semibold ${classes.text}`}>{value}</p>
      {trend && (
        <p
          className={`text-sm mt-1 ${
            trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {trend.value >= 0 ? '+' : ''}
          {trend.value}% {trend.label}
        </p>
      )}
    </div>
  );
}
