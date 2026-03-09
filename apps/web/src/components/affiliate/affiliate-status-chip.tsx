import type {
  AffiliateCommissionStatus,
  AffiliateLinkStatus,
  AffiliatePartnerStatus,
  AffiliatePayoutStatus,
  AffiliateReferralStatus,
} from '@agency-platform/shared';

type AffiliateStatus =
  | AffiliatePartnerStatus
  | AffiliateReferralStatus
  | AffiliateCommissionStatus
  | AffiliateLinkStatus
  | AffiliatePayoutStatus;

interface AffiliateStatusChipProps {
  status: AffiliateStatus;
  audience?: 'default' | 'partner';
}

const STATUS_STYLES: Record<AffiliateStatus, { label: string; className: string }> = {
  applied: {
    label: 'Applied',
    className: 'border-warning/30 bg-warning/10 text-warning',
  },
  approved: {
    label: 'Approved',
    className: 'border-teal/30 bg-teal/10 text-teal',
  },
  rejected: {
    label: 'Rejected',
    className: 'border-coral/30 bg-coral/10 text-coral',
  },
  disabled: {
    label: 'Disabled',
    className: 'border-border bg-muted/20 text-muted-foreground',
  },
  active: {
    label: 'Active',
    className: 'border-teal/30 bg-teal/10 text-teal',
  },
  archived: {
    label: 'Archived',
    className: 'border-border bg-muted/20 text-muted-foreground',
  },
  attributed: {
    label: 'Attributed',
    className: 'border-border bg-paper text-foreground',
  },
  qualified: {
    label: 'Qualified',
    className: 'border-teal/30 bg-teal/10 text-teal',
  },
  disqualified: {
    label: 'Disqualified',
    className: 'border-coral/30 bg-coral/10 text-coral',
  },
  pending: {
    label: 'Pending',
    className: 'border-warning/30 bg-warning/10 text-warning',
  },
  paid: {
    label: 'Paid',
    className: 'border-teal/30 bg-teal/10 text-teal',
  },
  void: {
    label: 'Void',
    className: 'border-coral/30 bg-coral/10 text-coral',
  },
  review_required: {
    label: 'Review Required',
    className: 'border-warning/30 bg-warning/10 text-warning',
  },
  draft: {
    label: 'Draft',
    className: 'border-border bg-muted/20 text-muted-foreground',
  },
  exported: {
    label: 'Exported',
    className: 'border-border bg-paper text-foreground',
  },
  canceled: {
    label: 'Canceled',
    className: 'border-border bg-muted/20 text-muted-foreground',
  },
};

export function AffiliateStatusChip({ status, audience = 'default' }: AffiliateStatusChipProps) {
  const config = STATUS_STYLES[status];
  const label =
    audience === 'partner' && status === 'review_required'
      ? 'Processing'
      : config.label;

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-mono font-medium uppercase tracking-wide ${config.className}`}
    >
      {label}
    </span>
  );
}
