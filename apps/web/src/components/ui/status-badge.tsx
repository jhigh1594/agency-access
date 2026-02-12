/**
 * Status Badge Component
 *
 * Displays status indicators with Acid Brutalism design system.
 * Supports both status-based and variant-based APIs.
 */

import { CheckCircle2, AlertCircle, XCircle, Clock } from 'lucide-react';

export type StatusType =
  | 'pending'
  | 'authorized'
  | 'expired'
  | 'cancelled'
  | 'past_due'
  | 'healthy'
  | 'expiring'
  | 'unknown'
  | 'active'
  | 'revoked'
  | 'invalid';

export type StatusVariant = 'success' | 'warning' | 'default';

interface StatusBadgeProps {
  status?: StatusType;
  badgeVariant?: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const STATUS_CONFIG: Record<
  StatusType,
  { label: string; className: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-acid/10 text-acid border border-acid/30',
    icon: <Clock className="h-3 w-3" />,
  },
  authorized: {
    label: 'Authorized',
    className: 'bg-teal/10 text-teal border border-teal/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  active: {
    label: 'Active',
    className: 'bg-teal/10 text-teal border border-teal/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  past_due: {
    label: 'Past Due',
    className: 'bg-acid/10 text-acid border border-acid/30',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-muted/10 text-muted-foreground border border-border',
    icon: <XCircle className="h-3 w-3" />,
  },
  revoked: {
    label: 'Revoked',
    className: 'bg-coral/10 text-coral border border-coral/30',
    icon: <XCircle className="h-3 w-3" />,
  },
  invalid: {
    label: 'Invalid',
    className: 'bg-coral/10 text-coral border border-coral/30',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  expired: {
    label: 'Expired',
    className: 'bg-coral/10 text-coral border border-coral/30',
    icon: <XCircle className="h-3 w-3" />,
  },
  healthy: {
    label: 'Healthy',
    className: 'bg-teal/10 text-teal border border-teal/30',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  expiring: {
    label: 'Expiring Soon',
    className: 'bg-acid/10 text-acid border border-acid/30',
    icon: <AlertCircle className="h-3 w-3" />,
  },
  unknown: {
    label: 'Unknown',
    className: 'bg-muted/10 text-muted-foreground border border-border',
    icon: <Clock className="h-3 w-3" />,
  },
};

const VARIANT_CONFIG: Record<StatusVariant, { label: string; className: string }> = {
  success: {
    label: 'Success',
    className: 'bg-teal/10 text-teal border border-teal/30',
  },
  warning: {
    label: 'Warning',
    className: 'bg-acid/10 text-acid border border-acid/30',
  },
  default: {
    label: 'Default',
    className: 'bg-muted/10 text-muted-foreground border border-border',
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

// Helper to convert string status values to StatusType
const stringToStatusType: Record<string, StatusType> = {
  active: 'active',
  past_due: 'past_due',
  canceled: 'cancelled',
  pending: 'pending',
  authorized: 'authorized',
  expired: 'expired',
  revoked: 'revoked',
  invalid: 'invalid',
  healthy: 'healthy',
  expiring: 'expiring',
  unknown: 'unknown',
};

export function StatusBadge({ status, badgeVariant, size = 'md', icon, children }: StatusBadgeProps) {
  // Convert string status to StatusType if needed
  const statusType = typeof status === 'string' ? stringToStatusType[status] || status : status;

  // Support variant-based API (for generic badges)
  if (badgeVariant) {
    const config = VARIANT_CONFIG[badgeVariant];
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-sm font-mono font-medium uppercase tracking-wider border ${config.className} ${
          SIZE_CLASSES[size]
        }`}
      >
        {icon}
        {children || config.label}
      </span>
    );
  }

  // Support status-based API (for specific platform statuses)
  if (statusType) {
    const config = STATUS_CONFIG[statusType] || STATUS_CONFIG.unknown;
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-sm font-mono font-medium uppercase tracking-wider border ${config.className} ${
          SIZE_CLASSES[size]
        }`}
      >
        {config.icon}
        {config.label}
      </span>
    );
  }

  // Fallback for unexpected usage
  return null;
}
