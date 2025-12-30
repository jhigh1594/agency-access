/**
 * Status Badge Component
 *
 * Displays status indicators with consistent styling across the application.
 * Used for access request status, token health, and other status indicators.
 */

import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';

export type StatusType =
  | 'pending'
  | 'authorized'
  | 'expired'
  | 'cancelled'
  | 'healthy'
  | 'expiring'
  | 'unknown';

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; className: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-3 w-3" />,
  },
  authorized: {
    label: 'Authorized',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <XCircle className="h-3 w-3" />,
  },
  expired: {
    label: 'Expired',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="h-3 w-3" />,
  },
  healthy: {
    label: 'Healthy',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  expiring: {
    label: 'Expiring Soon',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  unknown: {
    label: 'Unknown',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: <Clock className="h-3 w-3" />,
  },
};

const SIZE_CLASSES: Record<
  NonNullable<StatusBadgeProps['size']>,
  string
> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.className} ${SIZE_CLASSES[size]}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
