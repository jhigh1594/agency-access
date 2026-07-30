'use client';

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TriangleAlert,
  Unplug,
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';

type ItemClassification =
  | 'eligible_automatic'
  | 'manual_action_required'
  | 'reconnect_required'
  | 'not_safely_reversible';

const CLASSIFICATION_BADGE: Record<
  ItemClassification,
  { label: string; className: string }
> = {
  eligible_automatic: {
    label: 'Automatic',
    className: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  },
  manual_action_required: {
    label: 'Manual action required',
    className: 'bg-amber-100 text-amber-700 border border-amber-200',
  },
  reconnect_required: {
    label: 'Reconnect required',
    className: 'bg-blue-100 text-blue-700 border border-blue-200',
  },
  not_safely_reversible: {
    label: 'Not safely reversible',
    className: 'bg-red-100 text-red-700 border border-red-200',
  },
};

function ClassificationBadge({
  classification,
}: {
  classification: ItemClassification;
}) {
  const config = CLASSIFICATION_BADGE[classification];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium uppercase tracking-wider rounded-sm border ${config.className}`}
    >
      {config.label}
    </span>
  );
}

type ItemStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'completed_with_manual_follow_up'
  | 'failed_retryable'
  | 'failed_permanent'
  | 'awaiting_client_approval'
  | 'not_applicable'
  | 'skipped';

const ITEM_STATUS_BADGE: Record<ItemStatus, { label: string; className: string }> =
  {
    pending: { label: 'Pending', className: 'bg-gray-100 text-gray-600 border border-gray-200' },
    in_progress: { label: 'In progress', className: 'bg-blue-100 text-blue-700 border border-blue-200' },
    completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
    completed_with_manual_follow_up: {
      label: 'Needs follow-up',
      className: 'bg-amber-100 text-amber-700 border border-amber-200',
    },
    failed_retryable: { label: 'Failed (retryable)', className: 'bg-red-100 text-red-700 border border-red-200' },
    failed_permanent: { label: 'Failed', className: 'bg-red-100 text-red-700 border border-red-200' },
    awaiting_client_approval: {
      label: 'Pending approval',
      className: 'bg-amber-100 text-amber-700 border border-amber-200',
    },
    not_applicable: { label: 'N/A', className: 'bg-gray-100 text-gray-500 border border-gray-200' },
    skipped: { label: 'Skipped', className: 'bg-gray-100 text-gray-500 border border-gray-200' },
  };

function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const config = ITEM_STATUS_BADGE[status] ?? ITEM_STATUS_BADGE.pending;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium uppercase tracking-wider rounded-sm border ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function ItemStatusIcon({ status }: { status: ItemStatus }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case 'in_progress':
      return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    case 'awaiting_client_approval':
      return <Clock className="h-4 w-4 text-amber-600" />;
    case 'failed_retryable':
    case 'failed_permanent':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return null;
  }
}

interface PreviewItem {
  id: string;
  productName: string;
  description: string;
  classification: ItemClassification;
  status?: ItemStatus;
  outcome?: string;
  nextAction?: string;
  secretCleanupResult?: 'deleted' | 'already_absent' | 'failed';
  verificationMethod?: 'human_reported' | 'automatic';
}

const CONNECTION_LABEL = 'google-analytics-4 (GA4)';

const MOCK_PREVIEW_ITEMS: PreviewItem[] = [
  {
    id: 'item-1',
    productName: 'Google Analytics 4',
    description: 'Revoke OAuth token and remove data stream access',
    classification: 'eligible_automatic',
  },
  {
    id: 'item-2',
    productName: 'Google Search Console',
    description: 'Manual property removal required via GSC UI',
    classification: 'manual_action_required',
  },
  {
    id: 'item-3',
    productName: 'Google Ads',
    description: 'Connection expired — must reconnect to revoke',
    classification: 'reconnect_required',
  },
  {
    id: 'item-4',
    productName: 'Google Merchant Center',
    description: 'Feeds linked to external accounts; removal may break them',
    classification: 'not_safely_reversible',
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-foreground">{children}</h2>
    </div>
  );
}

function SelectionState() {
  return (
    <Card className="p-6 border-black/10">
      <div className="flex items-start gap-3">
        <Unplug className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Google Offboarding
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Revoke access and clean up secrets for this Google connection ({CONNECTION_LABEL}).
          </p>
          <Button
            variant="danger"
            size="sm"
            className="mt-4"
            leftIcon={<Unplug className="h-4 w-4" />}
          >
            Begin Offboarding
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PreviewState() {
  return (
    <Card className="p-6 border-black/10">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Offboarding Preview — {CONNECTION_LABEL}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Review all items before confirming. This action is irreversible.
            </p>
          </div>
        </div>

        <ul className="divide-y divide-border" role="list">
          {MOCK_PREVIEW_ITEMS.map((item) => (
            <li key={item.id} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.productName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              <ClassificationBadge classification={item.classification} />
            </li>
          ))}
        </ul>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" size="sm">
            Cancel
          </Button>
          <Button variant="danger" size="sm">
            Confirm Offboarding
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ConfirmationState() {
  return (
    <Card className="p-6 border-red-200 bg-red-50">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <TriangleAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900">
              Confirm Offboarding — {CONNECTION_LABEL}
            </h3>
            <p className="text-sm text-red-800 mt-1">
              This will permanently revoke access and clean up secrets for all items listed below.
              This action cannot be undone.
            </p>
          </div>
        </div>

        <ul className="divide-y divide-red-200" role="list">
          {MOCK_PREVIEW_ITEMS.map((item) => (
            <li key={item.id} className="py-2 flex items-center gap-2">
              <span className="text-sm text-red-900">{item.productName}</span>
              <ClassificationBadge classification={item.classification} />
            </li>
          ))}
        </ul>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" size="sm">
            Go back
          </Button>
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Unplug className="h-4 w-4" />}
          >
            Confirm Offboarding
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ProgressState() {
  const items: PreviewItem[] = [
    {
      id: 'p-1',
      productName: 'Google Analytics 4',
      description: 'Revoke OAuth token',
      classification: 'eligible_automatic',
      status: 'completed',
    },
    {
      id: 'p-2',
      productName: 'Google Ads API',
      description: 'Revoke API credentials',
      classification: 'eligible_automatic',
      status: 'in_progress',
    },
    {
      id: 'p-3',
      productName: 'Google Search Console',
      description: 'Manual property removal',
      classification: 'manual_action_required',
      status: 'awaiting_client_approval',
    },
    {
      id: 'p-4',
      productName: 'Google Merchant Center',
      description: 'Remove feed links',
      classification: 'not_safely_reversible',
      status: 'failed_retryable',
    },
  ];

  return (
    <Card className="p-6 border-black/10">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Unplug className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Offboarding in Progress — {CONNECTION_LABEL}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Run ID: run_abc123
            </p>
          </div>
        </div>

        <ul className="divide-y divide-border" role="list">
          {items.map((item) => (
            <li key={item.id} className="py-3 flex items-center gap-3">
              <ItemStatusIcon status={item.status!} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {item.productName}
                  </span>
                  <ItemStatusBadge status={item.status!} />
                </div>
                {item.status === 'awaiting_client_approval' && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pending external approval
                  </p>
                )}
                {item.status === 'failed_retryable' && (
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function ReceiptComplete() {
  const items: PreviewItem[] = [
    {
      id: 'r-1',
      productName: 'Google Analytics 4',
      description: 'Revoke OAuth token',
      classification: 'eligible_automatic',
      status: 'completed',
      outcome: 'OAuth token revoked successfully',
      secretCleanupResult: 'deleted',
    },
    {
      id: 'r-2',
      productName: 'Google Ads API',
      description: 'Revoke API credentials',
      classification: 'eligible_automatic',
      status: 'completed',
      outcome: 'API access revoked',
      secretCleanupResult: 'deleted',
    },
    {
      id: 'r-3',
      productName: 'Google Search Console',
      description: 'Manual property removal',
      classification: 'manual_action_required',
      status: 'completed',
      outcome: 'Property removed from account',
      secretCleanupResult: 'already_absent',
    },
  ];

  return (
    <Card className="p-6 border-black/10">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Offboarding Complete — {CONNECTION_LABEL}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Completed at 7/30/2026, 2:45:00 PM
            </p>
          </div>
        </div>

        <ul className="divide-y divide-border" role="list">
          {items.map((item) => (
            <li key={item.id} className="py-3">
              <div className="flex items-center gap-3">
                <ItemStatusIcon status={item.status!} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {item.productName}
                    </span>
                    <ItemStatusBadge status={item.status!} />
                  </div>
                  {item.outcome && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.outcome}</p>
                  )}
                  {item.secretCleanupResult && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Secret cleanup:{' '}
                      {item.secretCleanupResult === 'deleted'
                        ? 'Deleted'
                        : item.secretCleanupResult === 'already_absent'
                          ? 'Already absent'
                          : 'Failed'}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Start new offboarding
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ReceiptManualFollowUp() {
  const items: PreviewItem[] = [
    {
      id: 'm-1',
      productName: 'Google Analytics 4',
      description: 'Revoke OAuth token',
      classification: 'eligible_automatic',
      status: 'completed',
      outcome: 'OAuth token revoked',
      secretCleanupResult: 'deleted',
    },
    {
      id: 'm-2',
      productName: 'Google Search Console',
      description: 'Manual property removal',
      classification: 'manual_action_required',
      status: 'completed_with_manual_follow_up',
      outcome: 'Token revoked; property removal requires manual action in GSC UI',
      nextAction: 'Remove property manually from Google Search Console settings',
      verificationMethod: 'human_reported',
    },
  ];

  return (
    <Card className="p-6 border-black/10">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-amber-600" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Offboarding Complete — Follow-up Required — {CONNECTION_LABEL}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Completed at 7/30/2026, 2:50:00 PM
            </p>
          </div>
        </div>

        <ul className="divide-y divide-border" role="list">
          {items.map((item) => (
            <li key={item.id} className="py-3">
              <div className="flex items-center gap-3">
                <ItemStatusIcon status={item.status!} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {item.productName}
                    </span>
                    <ItemStatusBadge status={item.status!} />
                    {item.verificationMethod === 'human_reported' && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium uppercase tracking-wider rounded-sm border bg-gray-100 text-gray-600 border-gray-200">
                        Human-reported
                      </span>
                    )}
                  </div>
                  {item.outcome && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.outcome}</p>
                  )}
                  {item.nextAction && (
                    <p className="text-xs text-foreground mt-0.5 font-medium">
                      Next: {item.nextAction}
                    </p>
                  )}
                  {item.secretCleanupResult && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Secret cleanup:{' '}
                      {item.secretCleanupResult === 'deleted'
                        ? 'Deleted'
                        : item.secretCleanupResult === 'already_absent'
                          ? 'Already absent'
                          : 'Failed'}
                    </p>
                  )}
                </div>
                {item.verificationMethod === 'human_reported' &&
                  item.status === 'completed_with_manual_follow_up' && (
                    <Button variant="secondary" size="sm">
                      Attest
                    </Button>
                  )}
              </div>
            </li>
          ))}
        </ul>

        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Start new offboarding
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ReceiptIncomplete() {
  const items: PreviewItem[] = [
    {
      id: 'i-1',
      productName: 'Google Analytics 4',
      description: 'Revoke OAuth token',
      classification: 'eligible_automatic',
      status: 'completed',
      outcome: 'OAuth token revoked',
      secretCleanupResult: 'deleted',
    },
    {
      id: 'i-2',
      productName: 'Google Ads API',
      description: 'Revoke API credentials',
      classification: 'eligible_automatic',
      status: 'failed_retryable',
      outcome: 'API returned 503 — service temporarily unavailable',
    },
    {
      id: 'i-3',
      productName: 'Google Merchant Center',
      description: 'Remove feed links',
      classification: 'not_safely_reversible',
      status: 'pending',
      outcome: 'Blocked by upstream failure',
    },
  ];

  return (
    <Card className="p-6 border-black/10">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Offboarding Incomplete — {CONNECTION_LABEL}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Completed at 7/30/2026, 2:55:00 PM
            </p>
          </div>
        </div>

        <ul className="divide-y divide-border" role="list">
          {items.map((item) => (
            <li key={item.id} className="py-3">
              <div className="flex items-center gap-3">
                <ItemStatusIcon status={item.status!} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {item.productName}
                    </span>
                    <ItemStatusBadge status={item.status!} />
                  </div>
                  {item.outcome && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.outcome}</p>
                  )}
                  {item.secretCleanupResult && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Secret cleanup:{' '}
                      {item.secretCleanupResult === 'deleted'
                        ? 'Deleted'
                        : item.secretCleanupResult === 'already_absent'
                          ? 'Already absent'
                          : 'Failed'}
                    </p>
                  )}
                  {item.status === 'failed_retryable' && (
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Start new offboarding
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ErrorState() {
  return (
    <Card className="p-6 border-red-200 bg-red-50">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">Something went wrong</p>
          <p className="text-sm text-red-700 mt-1">
            Failed to fetch offboarding run: Network request failed (ECONNREFUSED). The API
            server may be temporarily unavailable. Please try again.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Try again
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function OffboardingPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link
            href="/dev"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Dev Tools
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-2">
            Google Offboarding Panel — State Preview
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visual reference for every panel state. No auth or API required.
          </p>
        </div>

        <div className="space-y-12">
          <div>
            <SectionLabel>1. Selection State</SectionLabel>
            <SelectionState />
          </div>

          <div>
            <SectionLabel>2. Preview State</SectionLabel>
            <PreviewState />
          </div>

          <div>
            <SectionLabel>3. Confirmation State</SectionLabel>
            <ConfirmationState />
          </div>

          <div>
            <SectionLabel>4. Progress State</SectionLabel>
            <ProgressState />
          </div>

          <div>
            <SectionLabel>5. Receipt — Completed</SectionLabel>
            <ReceiptComplete />
          </div>

          <div>
            <SectionLabel>6. Receipt — Manual Follow-up</SectionLabel>
            <ReceiptManualFollowUp />
          </div>

          <div>
            <SectionLabel>7. Receipt — Incomplete</SectionLabel>
            <ReceiptIncomplete />
          </div>

          <div>
            <SectionLabel>8. Error State</SectionLabel>
            <ErrorState />
          </div>
        </div>
      </div>
    </div>
  );
}
