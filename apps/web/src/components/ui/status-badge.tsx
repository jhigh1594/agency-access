/**
 * Status Badge Component
 *
 * Displays status indicators with Industrial Minimal styling.
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
  | 'unknown'
  | 'active'
  | 'revoked'
  | 'invalid';

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
    className: 'bg-warning/10 text-warning border border-warning/30',
    icon: <Clock className="h-3 w-3" />,
  },
  authorized: {
    label: 'Authorized',
    className: 'bg-success/10 text-success border border-success/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  active: {
    label: 'Active',
    className: 'bg-success/10 text-success border border-success/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-muted/10 text-muted border border-border',
    icon: <XCircle className="h-3 w-3" />,
  },
  revoked: {
    label: 'Revoked',
    className: 'bg-error/10 text-error border border-error/30',
    icon: <XCircle className="h-3 w-3" />,
  },
  invalid: {
    label: 'Invalid',
    className: 'bg-error/10 text-error border border-error/30',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  expired: {
    label: 'Expired',
    className: 'bg-error/10 text-error border border-error/30',
    icon: <XCircle className="h-3 w-3" />,
  },
  healthy: {
    label: 'Healthy',
    className: 'bg-success/10 text-success border border-success/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  expiring: {
    label: 'Expiring Soon',
    className: 'bg-warning/10 text-warning border border-warning/30',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  unknown: {
    label: 'Unknown',
    className: 'bg-muted/10 text-muted border border-border',
    icon: <Clock className="h-3 w-3" />,
  },
};

const SIZE_CLASSES: Record<
  NonNullable<StatusBadgeProps['size']>,
  string
> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-sm font-mono font-medium uppercase tracking-wider border ${config.className} ${SIZE_CLASSES[size]}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}
