'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Card } from '@/components/ui';
import {
  type OffboardingItem,
  type OffboardingRun,
  type PrepareOffboardingResponse,
  prepareOffboarding,
  confirmOffboarding,
  getOffboardingRun,
  retryOffboardingRun,
  attestOffboardingItem,
} from '@/lib/api/client-offboarding';

type PanelPhase =
  | 'selection'
  | 'preview'
  | 'confirming'
  | 'progress'
  | 'receipt'
  | 'error';

interface GoogleOffboardingPanelProps {
  agencyId: string;
  connectionId: string;
  connectionLabel: string;
}

type ItemClassification = OffboardingItem['classification'];

const CLASSIFICATION_BADGE: Record<ItemClassification, { label: string; className: string }> = {
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

function ClassificationBadge({ classification }: { classification: ItemClassification }) {
  const config = CLASSIFICATION_BADGE[classification];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium uppercase tracking-wider rounded-sm border ${config.className}`}
    >
      {config.label}
    </span>
  );
}

type ItemStatus = OffboardingRun['items'][number]['status'];

const ITEM_STATUS_BADGE: Record<ItemStatus, { label: string; className: string }> = {
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

function isTerminalRunStatus(status: OffboardingRun['status']): boolean {
  return ['completed', 'completed_with_manual_follow_up', 'incomplete', 'failed'].includes(status);
}

const POLL_INTERVAL_MS = 3000;

export function GoogleOffboardingPanel({
  agencyId,
  connectionId,
  connectionLabel,
}: GoogleOffboardingPanelProps) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<PanelPhase>('selection');
  const [previewData, setPreviewData] = useState<PrepareOffboardingResponse | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tokenProvider = useCallback(() => getToken(), [getToken]);
  const runQueryKey = ['offboarding-run', agencyId, connectionId, activeRunId];

  const { data: runData, error: runError } = useQuery({
    queryKey: runQueryKey,
    queryFn: () => getOffboardingRun(agencyId, connectionId, activeRunId!, tokenProvider),
    enabled: !!activeRunId,
    refetchInterval: (query) => {
      const run = query.state.data;
      if (!run || 'error' in run) return false;
      if (isTerminalRunStatus(run.data.status)) return false;
      return POLL_INTERVAL_MS;
    },
  });

  useEffect(() => {
    if (!runData) return;
    if ('error' in runData) {
      setError(runData.error.message);
      return;
    }
    const run = runData.data;
    if (isTerminalRunStatus(run.status)) {
      setPhase('receipt');
    }
  }, [runData]);

  const prepareMutation = useMutation({
    mutationFn: () => prepareOffboarding(agencyId, connectionId, tokenProvider),
    onSuccess: (result) => {
      if ('error' in result) {
        setError(result.error.message);
        return;
      }
      setPreviewData(result.data);
      setPhase('preview');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (capabilityToken: string) =>
      confirmOffboarding(agencyId, connectionId, capabilityToken, tokenProvider),
    onSuccess: (result) => {
      if ('error' in result) {
        setError(result.error.message);
        setPhase('preview');
        return;
      }
      setActiveRunId(result.data.id);
      setPhase('progress');
      queryClient.invalidateQueries({ queryKey: runQueryKey });
    },
  });

  const retryMutation = useMutation({
    mutationFn: () =>
      retryOffboardingRun(agencyId, connectionId, activeRunId!, tokenProvider),
    onSuccess: (result) => {
      if ('error' in result) {
        setError(result.error.message);
        return;
      }
      queryClient.invalidateQueries({ queryKey: runQueryKey });
    },
  });

  const attestMutation = useMutation({
    mutationFn: (itemId: string) =>
      attestOffboardingItem(agencyId, connectionId, activeRunId!, itemId, tokenProvider),
    onSuccess: (result) => {
      if ('error' in result) {
        setError(result.error.message);
        return;
      }
      queryClient.invalidateQueries({ queryKey: runQueryKey });
    },
  });

  const handleBegin = () => {
    setError(null);
    prepareMutation.mutate();
  };

  const handleConfirm = () => {
    if (!previewData) return;
    setError(null);
    setPhase('confirming');
  };

  const handleConfirmExecute = () => {
    if (!previewData) return;
    confirmMutation.mutate(previewData.capabilityToken);
  };

  const handleRetry = () => {
    setError(null);
    retryMutation.mutate();
  };

  const handleAttest = (itemId: string) => {
    setError(null);
    attestMutation.mutate(itemId);
  };

  const handleReset = () => {
    setPhase('selection');
    setPreviewData(null);
    setActiveRunId(null);
    setError(null);
  };

  if (error && !prepareMutation.isPending && !confirmMutation.isPending) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Something went wrong</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={handleReset}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Try again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (phase === 'selection') {
    return (
      <Card className="p-6 border-black/10">
        <div className="flex items-start gap-3">
          <Unplug className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">Google Offboarding</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Revoke access and clean up secrets for this Google connection ({connectionLabel}).
            </p>
            <Button
              variant="danger"
              size="sm"
              className="mt-4"
              onClick={handleBegin}
              isLoading={prepareMutation.isPending}
              leftIcon={<Unplug className="h-4 w-4" />}
            >
              Begin Offboarding
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (phase === 'preview' && previewData) {
    return (
      <Card className="p-6 border-black/10">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Offboarding Preview — {connectionLabel}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Review all items before confirming. This action is irreversible.
              </p>
            </div>
          </div>

          <ul className="divide-y divide-border" role="list">
            {previewData.items.map((item) => (
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
            <Button variant="secondary" size="sm" onClick={handleReset}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirm}>
              Confirm Offboarding
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (phase === 'confirming' && previewData) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <TriangleAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">
                Confirm Offboarding — {connectionLabel}
              </h3>
              <p className="text-sm text-red-800 mt-1">
                This will permanently revoke access and clean up secrets for all items listed below.
                This action cannot be undone.
              </p>
            </div>
          </div>

          <ul className="divide-y divide-red-200" role="list">
            {previewData.items.map((item) => (
              <li key={item.id} className="py-2 flex items-center gap-2">
                <span className="text-sm text-red-900">{item.productName}</span>
                <ClassificationBadge classification={item.classification} />
              </li>
            ))}
          </ul>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setPhase('preview')}>
              Go back
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmExecute}
              isLoading={confirmMutation.isPending}
              leftIcon={<Unplug className="h-4 w-4" />}
            >
              Confirm Offboarding
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (phase === 'progress') {
    const run = runData && !('error' in runData) ? runData.data : null;

    if (runError || (runData && 'error' in runData)) {
      const msg = (runData && 'error' in runData) ? runData.error.message : 'Failed to fetch run status';
      return (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Offboarding progress unavailable</p>
              <p className="text-sm text-red-700 mt-1">{msg}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => queryClient.invalidateQueries({ queryKey: runQueryKey })}
                leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Refresh
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    if (!run) {
      return (
        <Card className="p-6 border-black/10">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading offboarding status...</span>
          </div>
        </Card>
      );
    }

    return (
      <Card className="p-6 border-black/10">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Unplug className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Offboarding in Progress — {connectionLabel}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Run ID: {run.id}
              </p>
            </div>
          </div>

          <ul className="divide-y divide-border" role="list">
            {run.items.map((item) => (
              <li key={item.id} className="py-3 flex items-center gap-3">
                <ItemStatusIcon status={item.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {item.productName}
                    </span>
                    <ItemStatusBadge status={item.status} />
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
                        onClick={handleRetry}
                        isLoading={retryMutation.isPending}
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

  if (phase === 'receipt') {
    const run = runData && !('error' in runData) ? runData.data : null;

    if (!run) {
      return (
        <Card className="p-6 border-black/10">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading receipt...</span>
          </div>
        </Card>
      );
    }

    const runStatusLabel: Record<OffboardingRun['status'], string> = {
      completed: 'Offboarding Complete',
      completed_with_manual_follow_up: 'Offboarding Complete — Follow-up Required',
      incomplete: 'Offboarding Incomplete',
      failed: 'Offboarding Failed',
      pending_confirmation: 'Pending',
      executing: 'In Progress',
    };

    const runStatusIcon: Record<OffboardingRun['status'], React.ReactNode> = {
      completed: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      completed_with_manual_follow_up: <CheckCircle2 className="h-5 w-5 text-amber-600" />,
      incomplete: <AlertCircle className="h-5 w-5 text-amber-600" />,
      failed: <AlertCircle className="h-5 w-5 text-red-600" />,
      pending_confirmation: <Clock className="h-5 w-5 text-muted-foreground" />,
      executing: <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />,
    };

    return (
      <Card className="p-6 border-black/10">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {runStatusIcon[run.status]}
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {runStatusLabel[run.status]} — {connectionLabel}
              </h3>
              {run.completedAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Completed at {new Date(run.completedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <ul className="divide-y divide-border" role="list">
            {run.items.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex items-center gap-3">
                  <ItemStatusIcon status={item.status} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {item.productName}
                      </span>
                      <ItemStatusBadge status={item.status} />
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
                    {item.status === 'awaiting_client_approval' && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Pending external approval
                      </p>
                    )}
                  </div>
                  {item.verificationMethod === 'human_reported' &&
                    item.status === 'completed_with_manual_follow_up' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAttest(item.id)}
                        isLoading={attestMutation.isPending}
                      >
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
              onClick={handleReset}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              Start new offboarding
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}
