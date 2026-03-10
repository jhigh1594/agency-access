'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import posthog from 'posthog-js';
import { CopyCode } from '@/components/client-auth/pinterest/CopyCode';
import { InviteFlowShell } from '@/components/flow/invite-flow-shell';
import { ManualInviteHeader } from '@/components/flow/manual-invite-header';
import { InviteStickyRail } from '@/components/flow/invite-sticky-rail';
import { InviteLoadStateCard } from '@/components/flow/invite-load-state-card';
import {
  ManualChecklistWizard,
  type ManualStepConfig,
} from '@/components/flow/manual-checklist-wizard';
import { Button } from '@/components/ui';
import { buildClientInviteConnectViewUrl } from '@/lib/client-invite-platforms';
import { useInviteRequestLoader } from '@/lib/query/use-invite-request-loader';
import type { ClientAccessRequestPayload } from '@agency-platform/shared';

interface ManualPageData {
  agencyName: string;
  clientName?: string;
  agencyEmail: string;
  clientEmail?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

export default function SnapchatManualPage() {
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
      clientName: payload.clientName,
      agencyEmail: payload.manualInviteTargets?.snapchat?.agencyEmail || 'your agency Snapchat business email',
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
    source: 'manual-snapchat',
    parseData: parseManualData,
  });

  const submitManualConnection = async () => {
    if (!data || submitting) return;

    setSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/${token}/snapchat/manual-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencyEmail: data.agencyEmail,
          clientEmail: data.clientEmail,
          platform: 'snapchat',
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error || !result.data?.connectionId) {
        throw new Error(result.error?.message || 'Failed to create Snapchat connection');
      }

      router.push(`/invite/${token}?step=2&platform=snapchat&connectionId=${result.data.connectionId}`);
    } catch (err) {
      setSubmissionError(err instanceof Error ? err.message : 'Failed to create Snapchat connection');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = useMemo<ManualStepConfig[]>(() => {
    if (!data) return [];

    return [
      {
        id: 'copy-business-email',
        title: 'Copy business email',
        description: 'Use this email for both Snapchat Business invites.',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Snapchat Business Email</p>
            <CopyCode value={data.agencyEmail} label="Agency Snapchat Business Email" />
          </div>
        ),
        primaryAction: { label: 'I copied this' },
      },
      {
        id: 'organization-invite',
        title: 'Invite at the organization level',
        description: 'Open Snapchat Ads Manager, go to Members, and invite this email as Organization Admin.',
        content: (
          <div className="space-y-3">
            <a
              href="https://ads.snapchat.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/20"
            >
              Open Snapchat Ads Manager
              <ExternalLink className="h-4 w-4" />
            </a>
            <div className="rounded-lg border border-border bg-muted/10 px-4 py-3">
              <ul className="list-disc pl-5 space-y-2 text-sm text-foreground">
                <li>Open the menu in the top-left corner.</li>
                <li>Go to Members.</li>
                <li>Click Invite Members.</li>
                <li>Paste <span className="font-mono">{data.agencyEmail}</span>.</li>
                <li>Select the role <span className="font-medium">Organization Admin</span>.</li>
              </ul>
            </div>
          </div>
        ),
        primaryAction: { label: 'I invited the organization admin' },
      },
      {
        id: 'ad-account-invite',
        title: 'Invite at the ad account level',
        description: 'Open the ad account, then Members and Billing, and invite the same email as Account Admin.',
        content: (
          <div className="rounded-lg border border-border bg-muted/10 px-4 py-3">
            <ul className="list-disc pl-5 space-y-2 text-sm text-foreground">
              <li>Open Ad Accounts from the Snapchat menu.</li>
              <li>Select the ad account you want to share.</li>
              <li>Open Members and Billing.</li>
              <li>Click Invite Members.</li>
              <li>Paste <span className="font-mono">{data.agencyEmail}</span>.</li>
              <li>Select the role <span className="font-medium">Account Admin</span>.</li>
            </ul>
          </div>
        ),
        primaryAction: { label: 'I invited the ad account admin' },
      },
      {
        id: 'confirm-completion',
        title: 'Confirm and continue',
        description: 'Confirm completion and return to your authorization request.',
        content: submissionError ? (
          <div className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
            {submissionError}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Confirm both Snapchat invites were completed before continuing.
          </p>
        ),
        completionGate: {
          label: 'I completed Snapchat Business and ad account sharing',
          checked: completionConfirmed,
          onChange: (checked) => {
            setCompletionConfirmed(checked);
            if (checked) {
              posthog.capture('client_manual_completion_confirmed', {
                platform: 'snapchat',
              });
            }
          },
          requiredMessage: 'Confirm completion before continuing.',
        },
        primaryAction: {
          label: 'Return to request',
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
            ? 'Snapchat setup took too long to load. Retry or contact support.'
            : 'This request link is invalid or expired. Contact your agency for a new link.')
        }
        onRetry={retry}
      />
    );
  }

  return (
    <InviteFlowShell
      title={data.agencyName}
      description="Connect Snapchat by completing each checklist step."
      header={
        <ManualInviteHeader
          agencyName={data.agencyName}
          platformName="Snapchat"
          clientName={data.clientName}
          clientEmail={data.clientEmail}
          logoUrl={data.branding?.logoUrl}
          securityNote="Use only Snapchat-native invite screens. Never share credentials."
          backAction={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(buildClientInviteConnectViewUrl(token, 'snapchat') as any)}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back
            </Button>
          }
        />
      }
      layoutMode="split"
      showProgress={false}
      rail={
        <InviteStickyRail
          objective="Complete Snapchat Business sharing and return to your authorization request."
          securityNote="Use only Snapchat Ads Manager and never share credentials."
          identities={[{ label: 'Snapchat Business Email', value: data.agencyEmail }]}
          completedCount={railState.stepIndex}
          totalCount={railState.totalSteps}
          actionStatus={{
            label: railState.label,
            disabledReason: railState.blockedReason,
          }}
        />
      }
    >
      <ManualChecklistWizard
        platformName="Snapchat"
        steps={steps}
        onStepView={({ stepId, stepIndex, totalSteps }) => {
          posthog.capture('client_manual_step_viewed', {
            platform: 'snapchat',
            step_id: stepId,
            step_index: stepIndex,
            total_steps: totalSteps,
          });
        }}
        onStepAdvanced={({ fromStepId, toStepId, fromStepIndex, toStepIndex, totalSteps }) => {
          posthog.capture('client_manual_step_advanced', {
            platform: 'snapchat',
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
