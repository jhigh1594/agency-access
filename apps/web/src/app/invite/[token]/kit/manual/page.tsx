'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import posthog from 'posthog-js';
import { KitCopyButton } from '@/components/client-auth/kit/KitCopyButton';
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
  agencyEmail: string;
  clientEmail?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

export default function KitManualPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

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
      agencyEmail: payload.manualInviteTargets?.kit?.agencyEmail || 'your agency contact email',
      clientEmail: payload.clientEmail,
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
    source: 'manual-kit',
    parseData: parseManualData,
  });

  const submitManualConnection = async () => {
    if (!data || submitting) return;

    setSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/${token}/kit/manual-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencyEmail: data.agencyEmail,
          clientEmail: data.clientEmail,
          platform: 'kit',
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error || !result.data?.connectionId) {
        throw new Error(result.error?.message || 'Failed to create Kit connection');
      }

      router.push(`/invite/${token}?step=2&platform=kit&connectionId=${result.data.connectionId}`);
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'Failed to create Kit connection');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = useMemo<ManualStepConfig[]>(() => {
    if (!data) return [];

    return [
      {
        id: 'copy-invite-email',
        title: 'Copy invite email',
        description: 'Use this email when inviting your agency into Kit.',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Invite email</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                readOnly
                value={data.agencyEmail}
                className="flex-1 rounded-lg border border-border bg-paper px-3 py-2 text-sm font-mono text-ink"
              />
              <KitCopyButton text={data.agencyEmail} />
            </div>
          </div>
        ),
        primaryAction: { label: 'I copied this' },
      },
      {
        id: 'open-team-settings',
        title: 'Open Kit team settings',
        description: 'Sign in and navigate to Account Settings then Team.',
        content: (
          <div className="space-y-3">
            <a
              href="https://app.kit.com/login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/20"
            >
              Open Kit Login
              <ExternalLink className="h-4 w-4" />
            </a>
            <p className="text-sm text-muted-foreground">
              From your account, go to <span className="font-medium text-foreground">Account Settings</span> then{' '}
              <span className="font-medium text-foreground">Team</span>.
            </p>
          </div>
        ),
        primaryAction: { label: 'I opened team settings' },
      },
      {
        id: 'send-invite',
        title: 'Invite your agency in Kit',
        description: 'Invite a team member and choose the appropriate role before sending.',
        content: (
          <div className="rounded-lg border border-border bg-muted/10 px-4 py-3">
            <ul className="space-y-2 text-sm text-foreground list-disc pl-5">
              <li>Select Invite a team member.</li>
              <li>Paste <span className="font-mono">{data.agencyEmail}</span>.</li>
              <li>Choose the role you want your agency to have.</li>
              <li>Send the invite email from Kit.</li>
            </ul>
          </div>
        ),
        primaryAction: { label: 'I sent the invite' },
      },
      {
        id: 'confirm-completion',
        title: 'Confirm and continue',
        description: 'We will return you to the authorization request once confirmed.',
        content: submissionError ? (
          <div className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
            {submissionError}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Confirm completion and continue back to the request flow.</p>
        ),
        completionGate: {
          label: `I invited ${data.agencyEmail} to my Kit account`,
          checked: completionConfirmed,
          onChange: (checked) => {
            setCompletionConfirmed(checked);
            if (checked) {
              posthog.capture('client_manual_completion_confirmed', {
                platform: 'kit',
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
            ? 'Kit setup took too long to load. Retry or contact support.'
            : 'This request link is invalid or expired. Contact your agency for a new link.')
        }
        onRetry={retry}
      />
    );
  }

  return (
    <InviteFlowShell
      title={data.agencyName}
      description="Connect Kit by completing each checklist step."
      layoutMode="split"
      showProgress={false}
      rightSlot={
        <Button variant="ghost" size="sm" onClick={() => router.back()} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
      }
      rail={
        <InviteStickyRail
          objective="Complete Kit invite setup and return to your authorization request."
          securityNote="Use only Kit-native invite screens. Never share credentials."
          identities={[{ label: 'Kit invite email', value: data.agencyEmail }]}
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
        platformName="Kit"
        steps={steps}
        onStepView={({ stepId, stepIndex, totalSteps }) => {
          posthog.capture('client_manual_step_viewed', {
            platform: 'kit',
            step_id: stepId,
            step_index: stepIndex,
            total_steps: totalSteps,
          });
        }}
        onStepAdvanced={({ fromStepId, toStepId, fromStepIndex, toStepIndex, totalSteps }) => {
          posthog.capture('client_manual_step_advanced', {
            platform: 'kit',
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
