'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import posthog from 'posthog-js';
import { BeehiivCopyButton } from '@/components/client-auth/beehiiv/BeehiivCopyButton';
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

export default function BeehiivManualPage() {
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
      agencyEmail: payload.manualInviteTargets?.beehiiv?.agencyEmail || 'your agency contact email',
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
    source: 'manual-beehiiv',
    parseData: parseManualData,
  });

  const submitManualConnection = async () => {
    if (!data || submitting) return;

    setSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/${token}/beehiiv/manual-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencyEmail: data.agencyEmail,
          clientEmail: data.clientEmail,
          platform: 'beehiiv',
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error || !result.data?.connectionId) {
        throw new Error(result.error?.message || 'Failed to create Beehiiv connection');
      }

      router.push(`/invite/${token}?step=2&platform=beehiiv&connectionId=${result.data.connectionId}`);
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'Failed to create Beehiiv connection');
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
        description: 'Use this email when adding your agency as a Beehiiv teammate.',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Invite email</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                readOnly
                value={data.agencyEmail}
                className="flex-1 rounded-lg border border-border bg-paper px-3 py-2 text-sm font-mono text-ink"
              />
              <BeehiivCopyButton text={data.agencyEmail} />
            </div>
          </div>
        ),
        primaryAction: { label: 'I copied this' },
      },
      {
        id: 'open-team-settings',
        title: 'Open Beehiiv team settings',
        description: 'Sign in to Beehiiv and open your workspace team settings.',
        content: (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <a
                href="https://app.beehiiv.com/login"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/20"
              >
                Open Beehiiv Login
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="https://app.beehiiv.com/settings/workspace/team"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/20"
              >
                Open Team Settings
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ),
        primaryAction: { label: 'I opened settings' },
      },
      {
        id: 'send-invite',
        title: 'Invite your agency in Beehiiv',
        description: 'Select Invite New User, paste the email, choose access, then send.',
        content: (
          <div className="rounded-lg border border-border bg-muted/10 px-4 py-3">
            <ul className="space-y-2 text-sm text-foreground list-disc pl-5">
              <li>Click Invite New User in the team screen.</li>
              <li>Paste <span className="font-mono">{data.agencyEmail}</span>.</li>
              <li>Choose workspace or publication access and assign role.</li>
              <li>Send the email invite from Beehiiv.</li>
            </ul>
          </div>
        ),
        primaryAction: { label: 'I sent the invite' },
      },
      {
        id: 'confirm-completion',
        title: 'Confirm and continue',
        description: 'Once confirmed, we will mark Beehiiv as completed for this request.',
        content: submissionError ? (
          <div className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
            {submissionError}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Confirm this invite is complete, then continue back to the request flow.
          </p>
        ),
        completionGate: {
          label: `I invited ${data.agencyEmail} to my Beehiiv workspace`,
          checked: completionConfirmed,
          onChange: (checked) => {
            setCompletionConfirmed(checked);
            if (checked) {
              posthog.capture('client_manual_completion_confirmed', {
                platform: 'beehiiv',
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
            ? 'Beehiiv setup took too long to load. Retry or contact support.'
            : 'This request link is invalid or expired. Contact your agency for a new link.')
        }
        onRetry={retry}
      />
    );
  }

  return (
    <InviteFlowShell
      title={data.agencyName}
      description="Connect Beehiiv by completing each checklist step."
      layoutMode="split"
      showProgress={false}
      rightSlot={
        <Button variant="ghost" size="sm" onClick={() => router.back()} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back
        </Button>
      }
      rail={
        <InviteStickyRail
          objective="Complete Beehiiv invite setup and return to your authorization request."
          securityNote="Use only Beehiiv-native invite screens. Never share credentials."
          identities={[{ label: 'Beehiiv invite email', value: data.agencyEmail }]}
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
        platformName="Beehiiv"
        steps={steps}
        onStepView={({ stepId, stepIndex, totalSteps }) => {
          posthog.capture('client_manual_step_viewed', {
            platform: 'beehiiv',
            step_id: stepId,
            step_index: stepIndex,
            total_steps: totalSteps,
          });
        }}
        onStepAdvanced={({ fromStepId, toStepId, fromStepIndex, toStepIndex, totalSteps }) => {
          posthog.capture('client_manual_step_advanced', {
            platform: 'beehiiv',
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
