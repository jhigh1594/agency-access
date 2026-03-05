'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import posthog from 'posthog-js';
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

interface ShopifyManualData {
  agencyName: string;
  clientEmail?: string;
  shopDomain?: string;
  collaboratorCode?: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

function normalizeShopDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
}

function isValidShopDomain(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(value);
}

function isValidCollaboratorCode(value: string): boolean {
  return /^\d{4}$/.test(value.trim());
}

export default function ShopifyManualPage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [completionConfirmed, setCompletionConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [shopDomain, setShopDomain] = useState('');
  const [collaboratorCode, setCollaboratorCode] = useState('');
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

  const parseManualData = useCallback((payload: ClientAccessRequestPayload): ShopifyManualData => {
    return {
      agencyName: payload.agencyName,
      clientEmail: payload.clientEmail,
      shopDomain: payload.manualInviteTargets?.shopify?.shopDomain,
      collaboratorCode: payload.manualInviteTargets?.shopify?.collaboratorCode,
      branding: payload.branding,
    };
  }, []);

  const {
    data,
    error,
    phase,
    retry,
  } = useInviteRequestLoader<ShopifyManualData>({
    endpoint: `${process.env.NEXT_PUBLIC_API_URL}/api/client/${token}`,
    source: 'manual-shopify',
    parseData: parseManualData,
  });

  useEffect(() => {
    if (!data) return;
    if (data.shopDomain) setShopDomain(data.shopDomain);
    if (data.collaboratorCode) setCollaboratorCode(data.collaboratorCode);
  }, [data]);

  const hasValidShopDomain = isValidShopDomain(normalizeShopDomain(shopDomain));
  const hasValidCollaboratorCode = isValidCollaboratorCode(collaboratorCode);
  const isFormValid = hasValidShopDomain && hasValidCollaboratorCode;

  const submitManualConnection = async () => {
    if (!data || submitting || !isFormValid) return;

    setSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/${token}/shopify/manual-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'shopify',
          shopDomain: normalizeShopDomain(shopDomain),
          collaboratorCode: collaboratorCode.trim(),
          clientEmail: data.clientEmail,
        }),
      });

      const result = await response.json();
      if (!response.ok || result.error || !result.data?.connectionId) {
        throw new Error(result.error?.message || 'Failed to save Shopify collaborator details');
      }

      router.push(`/invite/${token}?step=2&platform=shopify&connectionId=${result.data.connectionId}`);
    } catch (err) {
      setSubmissionError(
        err instanceof Error ? err.message : 'Failed to save Shopify collaborator details'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const steps = useMemo<ManualStepConfig[]>(() => {
    if (!data) return [];

    return [
      {
        id: 'open-shopify-users',
        title: 'Open Shopify users and permissions',
        description: 'Sign in to your Shopify admin and open Users and permissions.',
        content: (
          <div className="flex flex-wrap gap-3">
            <a
              href="https://admin.shopify.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/20"
            >
              Open Shopify Admin
              <ExternalLink className="h-4 w-4" />
            </a>
            <a
              href="https://help.shopify.com/en/manual/your-account/users/security/collaborator-accounts"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/20"
            >
              Open Shopify Help
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        ),
        primaryAction: { label: 'I opened Shopify' },
      },
      {
        id: 'collect-collaborator-details',
        title: 'Copy your collaborator request code',
        description: 'Enter your store domain and 4-digit collaborator request code.',
        content: (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Shop domain</label>
              <input
                type="text"
                value={shopDomain}
                onChange={(event) => setShopDomain(event.target.value)}
                placeholder="your-store.myshopify.com"
                className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink"
              />
              {!hasValidShopDomain && shopDomain.trim().length > 0 ? (
                <p className="mt-1 text-xs text-coral">
                  Use a valid domain like <span className="font-mono">store-name.myshopify.com</span>.
                </p>
              ) : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Collaborator code</label>
              <input
                type="text"
                value={collaboratorCode}
                onChange={(event) => setCollaboratorCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="1234"
                className="w-full rounded-lg border border-border bg-paper px-3 py-2 text-sm font-mono text-ink"
                inputMode="numeric"
              />
              {!hasValidCollaboratorCode && collaboratorCode.trim().length > 0 ? (
                <p className="mt-1 text-xs text-coral">Collaborator code must be exactly 4 digits.</p>
              ) : null}
            </div>
          </div>
        ),
        primaryAction: {
          label: isFormValid ? 'I copied the code' : 'Details required',
          disabled: !isFormValid,
          disabledReason: !isFormValid
            ? 'A valid shop domain and 4-digit collaborator code are required.'
            : undefined,
        },
      },
      {
        id: 'request-agency-access',
        title: 'Send these details to your agency',
        description: 'Your agency uses these details in Shopify Partners to request access.',
        content: (
          <div className="rounded-lg border border-border bg-muted/10 px-4 py-3">
            <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
              <li>Shop domain: <span className="font-mono">{normalizeShopDomain(shopDomain)}</span></li>
              <li>Collaborator code: <span className="font-mono">{collaboratorCode.trim()}</span></li>
              <li>Your agency sends the collaborator access request from Shopify Partners.</li>
            </ul>
          </div>
        ),
        primaryAction: { label: 'I shared the details' },
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
            We will mark Shopify as complete once you confirm and continue.
          </p>
        ),
        completionGate: {
          label: 'I have shared my shop domain and collaborator code with the agency',
          checked: completionConfirmed,
          onChange: (checked) => {
            setCompletionConfirmed(checked);
            if (checked) {
              posthog.capture('client_manual_completion_confirmed', {
                platform: 'shopify',
              });
            }
          },
          requiredMessage: 'Confirm completion before continuing.',
        },
        primaryAction: {
          label: 'Continue',
          loading: submitting,
          loadingLabel: 'Saving...',
          onClick: submitManualConnection,
          disabled: !isFormValid,
          disabledReason: !isFormValid
            ? 'A valid shop domain and collaborator code are required.'
            : undefined,
        },
      },
    ];
  }, [
    collaboratorCode,
    completionConfirmed,
    data,
    hasValidCollaboratorCode,
    hasValidShopDomain,
    isFormValid,
    shopDomain,
    submissionError,
    submitting,
  ]);

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
            ? 'Shopify setup took too long to load. Retry or contact support.'
            : 'This request link is invalid or expired. Contact your agency for a new link.')
        }
        onRetry={retry}
      />
    );
  }

  const displayShopDomain = normalizeShopDomain(shopDomain) || 'Not provided yet';
  const displayCode = collaboratorCode.trim() || 'Not provided yet';

  return (
    <InviteFlowShell
      title={data.agencyName}
      description="Connect Shopify by completing each checklist step."
      layoutMode="split"
      showProgress={false}
      rightSlot={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
      }
      rail={
        <InviteStickyRail
          objective="Share Shopify collaborator details so your agency can request access."
          securityNote="Use only Shopify-native collaborator access screens. Never share passwords."
          identities={[
            { label: 'Shopify store', value: displayShopDomain },
            { label: 'Collaborator code', value: displayCode },
          ]}
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
        platformName="Shopify"
        steps={steps}
        onStepView={({ stepId, stepIndex, totalSteps }) => {
          posthog.capture('client_manual_step_viewed', {
            platform: 'shopify',
            step_id: stepId,
            step_index: stepIndex,
            total_steps: totalSteps,
          });
        }}
        onStepAdvanced={({ fromStepId, toStepId, fromStepIndex, toStepIndex, totalSteps }) => {
          posthog.capture('client_manual_step_advanced', {
            platform: 'shopify',
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
