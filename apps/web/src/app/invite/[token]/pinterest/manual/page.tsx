'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import posthog from 'posthog-js';
import { CopyCode } from '@/components/client-auth/pinterest/CopyCode';
import { InviteFlowShell } from '@/components/flow/invite-flow-shell';
import { InviteStickyRail } from '@/components/flow/invite-sticky-rail';
import { InviteLoadStateCard } from '@/components/flow/invite-load-state-card';
import {
  ManualChecklistWizard,
  type ManualStepConfig,
} from '@/components/flow/manual-checklist-wizard';
import { Button } from '@/components/ui';
import { useInviteRequestLoader } from '@/lib/query/use-invite-request-loader';
import type { ClientAccessRequestPayload } from '@agency-platform/shared';

interface ManualPageData {
  agencyName: string;
  clientEmail?: string;
  businessId?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

export default function PinterestManualPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [completionConfirmed, setCompletionConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [railState, setRailState] = useState<{
    stepIndex: number;
    totalSteps: number;
    label: string;
    blockedReason?: string;
  }>({
    stepIndex: 0,
    totalSteps: 4,
    label: 'Continue',
  });

  const parseManualData = useCallback((payload: ClientAccessRequestPayload): ManualPageData => {
    return {
      agencyName: payload.agencyName,
      clientEmail: payload.clientEmail,
      businessId: payload.manualInviteTargets?.pinterest?.businessId,
      branding: payload.branding,
    };
  }, []);

  const {
    data,
    error,
    phase,
    retry,
  } = useInviteRequestLoader<ManualPageData>({
    endpoint: `${process.env.NEXT_PUBLIC_API_URL}/api/client/${token}`,
    source: 'manual-pinterest',
    parseData: parseManualData,
  });

  const submitManualConnection = async () => {
    if (!data || !data.businessId || submitting) return;

    setSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/${token}/pinterest/manual-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'pinterest',
          businessId: data.businessId,
          clientEmail: data.clientEmail,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error || !result.data?.connectionId) {
        throw new Error(result.error?.message || 'Failed to connect Pinterest');
      }

      router.push(`/invite/${token}?step=2&platform=pinterest&connectionId=${result.data.connectionId}`);
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'Failed to connect Pinterest');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = useMemo<ManualStepConfig[]>(() => {
    if (!data) return [];

    const hasBusinessId = Boolean(data.businessId);

    return [
      {
        id: 'open-business-manager',
        title: 'Open Pinterest Business Manager',
        description: 'Sign in to Pinterest Business and open your business manager account.',
        content: (
          <a
            href="https://www.pinterest.com/business/business-manager/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/20"
          >
            Open Business Manager
            <ExternalLink className="h-4 w-4" />
          </a>
        ),
        primaryAction: { label: 'I opened Pinterest' },
      },
      {
        id: 'add-partner',
        title: 'Add your agency as partner',
        description: 'Open Partners in the sidebar and add a new partner by business ID.',
        content: hasBusinessId ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Use this business ID in the Add Partner modal.</p>
            <CopyCode value={data.businessId || ''} label="Agency Business ID" />
          </div>
        ) : (
          <div className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-3 text-sm text-coral">
            Pinterest Business ID is missing. Contact your agency before continuing.
          </div>
        ),
        primaryAction: {
          label: hasBusinessId ? 'I added the partner' : 'Business ID required',
          disabled: !hasBusinessId,
          disabledReason: !hasBusinessId ? 'Business ID is required before this step can continue.' : undefined,
        },
      },
      {
        id: 'assign-permissions',
        title: 'Assign permissions',
        description: 'Grant Admin permissions to the selected ad account and save.',
        content: (
          <div className="rounded-lg border border-border bg-muted/10 px-4 py-3">
            <ul className="space-y-2 text-sm text-foreground list-disc pl-5">
              <li>Select the ad account to share.</li>
              <li>Set partner permissions to Admin.</li>
              <li>Click Assign Permissions in Pinterest.</li>
            </ul>
          </div>
        ),
        primaryAction: { label: 'I assigned permissions' },
      },
      {
        id: 'confirm-completion',
        title: 'Confirm and continue',
        description: 'Confirm completion and return to the authorization request.',
        content: submissionError ? (
          <div className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
            {submissionError}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Confirm completion to finalize Pinterest setup for this request.</p>
        ),
        completionGate: {
          label: 'I completed Pinterest partner setup and permissions',
          checked: completionConfirmed,
          onChange: (checked) => {
            setCompletionConfirmed(checked);
            if (checked) {
              posthog.capture('client_manual_completion_confirmed', {
                platform: 'pinterest',
              });
            }
          },
          requiredMessage: 'Confirm completion before continuing.',
        },
        primaryAction: {
          label: 'Continue',
          loading: submitting,
          loadingLabel: 'Connecting...',
          onClick: submitManualConnection,
          disabled: !hasBusinessId,
          disabledReason: !hasBusinessId ? 'Business ID is required before finalizing Pinterest.' : undefined,
        },
      },
    ];
  }, [completionConfirmed, data, submissionError, submitting]);

  const handleStepStateChange = useCallback(
    ({
      stepIndex,
      totalSteps,
      actionLabel,
      blockedReason,
    }: {
      stepIndex: number;
      totalSteps: number;
      actionLabel: string;
      blockedReason?: string;
    }) => {
      setRailState((previous) => {
        if (
          previous.stepIndex === stepIndex &&
          previous.totalSteps === totalSteps &&
          previous.label === actionLabel &&
          previous.blockedReason === blockedReason
        ) {
          return previous;
        }

        return {
          stepIndex,
          totalSteps,
          label: actionLabel,
          blockedReason,
        };
      });
    },
    []
  );

  if (!data) {
    return (
      <InviteLoadStateCard
        phase={phase === 'ready' ? 'loading' : phase}
        message={
          error ||
          (phase === 'timeout'
            ? 'Pinterest setup took too long to load. Retry or contact support.'
            : 'This request link is invalid or expired. Contact your agency for a new link.')
        }
        onRetry={retry}
      />
    );
  }

  return (
    <InviteFlowShell
      title={data.agencyName}
      description="Connect Pinterest by completing each checklist step."
      layoutMode="split"
      showProgress={false}
      rightSlot={
        <Button variant="ghost" size="sm" onClick={() => router.back()} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
      }
      rail={
        <InviteStickyRail
          objective="Complete Pinterest partner setup and return to your authorization request."
          securityNote="Use only Pinterest Business Manager and never share credentials."
          identities={
            data.businessId
              ? [{ label: 'Pinterest Business ID', value: data.businessId }]
              : [{ label: 'Pinterest Business ID', value: 'Missing - contact your agency' }]
          }
          completedCount={railState.stepIndex + 1}
          totalCount={railState.totalSteps}
          actionStatus={{
            label: railState.label,
            disabledReason: railState.blockedReason,
          }}
        />
      }
    >
      <ManualChecklistWizard
        platformName="Pinterest"
        steps={steps}
        onStepView={({ stepId, stepIndex, totalSteps }) => {
          posthog.capture('client_manual_step_viewed', {
            platform: 'pinterest',
            step_id: stepId,
            step_index: stepIndex,
            total_steps: totalSteps,
          });
        }}
        onStepAdvanced={({ fromStepId, toStepId, fromStepIndex, toStepIndex, totalSteps }) => {
          posthog.capture('client_manual_step_advanced', {
            platform: 'pinterest',
            from_step_id: fromStepId,
            to_step_id: toStepId,
            from_step_index: fromStepIndex,
            to_step_index: toStepIndex,
            total_steps: totalSteps,
          });
        }}
        onStepStateChange={handleStepStateChange}
      />
    </InviteFlowShell>
  );
}
