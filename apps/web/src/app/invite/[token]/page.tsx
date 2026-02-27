'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Check, Lock, RefreshCw } from 'lucide-react';
import posthog from 'posthog-js';
import { InviteFlowShell } from '@/components/flow/invite-flow-shell';
import { InviteStickyRail } from '@/components/flow/invite-sticky-rail';
import { InviteLoadStateCard } from '@/components/flow/invite-load-state-card';
import { PlatformAuthWizard } from '@/components/client-auth/PlatformAuthWizard';
import { Button } from '@/components/ui';
import { PLATFORM_NAMES } from '@agency-platform/shared';
import { useInviteRequestLoader } from '@/lib/query/use-invite-request-loader';
import type { ClientAccessRequestPayload, Platform } from '@agency-platform/shared';

type PagePhase = 'intake' | 'platforms' | 'complete';

const SESSION_STORAGE_PREFIX = 'invite-progress:';
const MANUAL_CALLBACK_PLATFORMS: Platform[] = ['beehiiv', 'kit', 'pinterest'];

export default function ClientAuthorizationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;

  const urlConnectionId = searchParams.get('connectionId');
  const urlPlatform = searchParams.get('platform') as Platform | null;
  const urlStep = searchParams.get('step');

  const [phase, setPhase] = useState<PagePhase>('intake');
  const [data, setData] = useState<ClientAccessRequestPayload | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [intakeResponses, setIntakeResponses] = useState<Record<string, string>>({});
  const [completedPlatforms, setCompletedPlatforms] = useState<Set<Platform>>(new Set());
  const [oauthConnectionInfo, setOauthConnectionInfo] = useState<{
    connectionId: string;
    platform: Platform;
  } | null>(null);

  const completionSubmittedRef = useRef(false);
  const startedTrackedRef = useRef(false);

  const storageKey = `${SESSION_STORAGE_PREFIX}${token}`;

  const {
    data: loadedPayload,
    error: loadError,
    phase: loadPhase,
    retry: retryLoad,
  } = useInviteRequestLoader<ClientAccessRequestPayload>({
    endpoint: `${process.env.NEXT_PUBLIC_API_URL}/api/client/${token}`,
    source: 'invite-core',
  });

  const requestedPlatforms = useMemo(
    () => data?.platforms?.map((group) => group.platformGroup as Platform) || [],
    [data]
  );

  const isComplete = useMemo(() => {
    if (!data?.platforms?.length) return false;
    return data.platforms.every((group) => completedPlatforms.has(group.platformGroup as Platform));
  }, [data, completedPlatforms]);

  const railIdentities = useMemo(() => {
    if (!data) return [];

    const targets = data.manualInviteTargets || {};
    const identities: Array<{ label: string; value: string }> = [];

    const emailPlatforms: Array<Platform> = ['beehiiv', 'kit', 'klaviyo', 'mailchimp'];
    for (const platform of emailPlatforms) {
      const value = (targets as any)?.[platform]?.agencyEmail;
      if (value) {
        identities.push({ label: `${PLATFORM_NAMES[platform]} invite email`, value });
      }
    }

    const pinterestBusinessId = (targets as any)?.pinterest?.businessId;
    if (pinterestBusinessId) {
      identities.push({ label: 'Pinterest Business ID', value: pinterestBusinessId });
    }

    return identities;
  }, [data]);

  useEffect(() => {
    if (!loadedPayload) return;

    setData(loadedPayload);

    const apiCompleted = new Set<Platform>(
      (loadedPayload.authorizationProgress?.completedPlatforms || []) as Platform[]
    );

    let sessionCompleted = new Set<Platform>();
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        sessionCompleted = new Set<Platform>(JSON.parse(raw));
      }
    } catch {
      sessionStorage.removeItem(storageKey);
    }

    let mergedCompleted = new Set<Platform>([
      ...Array.from(apiCompleted),
      ...Array.from(sessionCompleted),
    ]);

    if (!urlStep && !startedTrackedRef.current) {
      startedTrackedRef.current = true;
      posthog.capture('client_authorization_started', {
        access_request_token: token,
        agency_name: loadedPayload.agencyName,
        client_name: loadedPayload.clientName,
        client_email: loadedPayload.clientEmail,
        platform_count: loadedPayload.platforms?.length || 0,
        platforms: loadedPayload.platforms?.map((p) => p.platformGroup) || [],
        has_intake_fields: loadedPayload.intakeFields?.length > 0,
        has_custom_branding: !!loadedPayload.branding?.logoUrl,
      });
    }

    if (urlStep === '2' && urlConnectionId && urlPlatform) {
      if (MANUAL_CALLBACK_PLATFORMS.includes(urlPlatform)) {
        mergedCompleted = new Set<Platform>([...Array.from(mergedCompleted), urlPlatform]);
        setOauthConnectionInfo(null);
      } else {
        setOauthConnectionInfo({ connectionId: urlConnectionId, platform: urlPlatform });
      }

      setCompletedPlatforms(mergedCompleted);
      setPhase('platforms');
      return;
    }

    setCompletedPlatforms(mergedCompleted);
    setPhase(loadedPayload.intakeFields?.length > 0 ? 'intake' : 'platforms');
  }, [loadedPayload, storageKey, token, urlConnectionId, urlPlatform, urlStep]);

  useEffect(() => {
    if (!completedPlatforms.size) return;
    sessionStorage.setItem(storageKey, JSON.stringify(Array.from(completedPlatforms)));
  }, [completedPlatforms, storageKey]);

  useEffect(() => {
    if (!data) return;
    if (phase !== 'platforms') return;
    if (!isComplete) return;

    setPhase('complete');

    if (completionSubmittedRef.current) return;

    const submitCompletion = async () => {
      completionSubmittedRef.current = true;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/${token}/complete`, {
          method: 'POST',
        });

        const result = await response.json();
        if (!response.ok || result.error) {
          throw new Error(result.error?.message || 'Failed to finalize authorization');
        }

        posthog.capture('client_authorization_completed', {
          access_request_token: token,
          agency_name: data.agencyName,
          client_name: data.clientName,
          platforms_completed: Array.from(completedPlatforms),
          total_platforms: data.platforms.length,
        });

        sessionStorage.removeItem(storageKey);
      } catch (error) {
        completionSubmittedRef.current = false;
        setCompletionError(
          error instanceof Error
            ? error.message
            : 'Authorization was completed, but we could not finalize status. Retry below.'
        );
      }
    };

    submitCompletion();
  }, [data, phase, isComplete, token, completedPlatforms, storageKey]);

  const handleRetryComplete = async () => {
    setCompletionError(null);
    completionSubmittedRef.current = false;
    setPhase('platforms');
    setTimeout(() => setPhase('complete'), 0);
  };

  const handleIntakeSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPhase('platforms');
  };

  const handlePlatformComplete = (platform: Platform) => {
    setCompletedPlatforms((prev) => {
      const updated = new Set(prev);
      updated.add(platform);
      return updated;
    });

    posthog.capture('client_platform_authorized', {
      access_request_token: token,
      platform,
      platform_name: PLATFORM_NAMES[platform],
      total_completed: completedPlatforms.size + 1,
      total_platforms: data?.platforms?.length || 0,
    });
  };

  if (!data) {
    return (
      <InviteLoadStateCard
        phase={loadPhase === 'ready' ? 'loading' : loadPhase}
        message={
          loadError ||
          (loadPhase === 'timeout'
            ? 'The request took too long to load. Please retry or contact your agency for a new link.'
            : 'This request link is invalid or expired. Contact your agency for a new link.')
        }
        onRetry={retryLoad}
      />
    );
  }

  const step = phase === 'intake' ? 1 : phase === 'platforms' ? 2 : 3;
  const layoutMode = phase === 'intake' ? 'focused' : 'split';

  return (
    <InviteFlowShell
      title={data.agencyName}
      description={`Authorize access for ${data.clientName}`}
      step={step}
      totalSteps={3}
      steps={['Setup', 'Connect', 'Done']}
      layoutMode={layoutMode}
      rightSlot={
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
          <span className="font-semibold text-ink">Security:</span> OAuth only, no password sharing
        </div>
      }
      rail={
        <InviteStickyRail
          objective={
            phase === 'complete'
              ? 'Review your completed authorizations.'
              : 'Finish the remaining platform connection steps.'
          }
          securityNote="Official OAuth and platform-native invite flows only."
          identities={railIdentities}
          completedCount={completedPlatforms.size}
          totalCount={requestedPlatforms.length || 1}
          actionStatus={{
            label: phase === 'complete' ? 'Authorization complete' : 'Complete current platform step',
            disabledReason:
              phase === 'platforms' && requestedPlatforms.length > completedPlatforms.size
                ? 'Continue becomes available after platform step completion.'
                : undefined,
          }}
        />
      }
    >
      {phase === 'intake' && (
        <form
          onSubmit={handleIntakeSubmit}
          className="rounded-lg border-2 border-black bg-card shadow-brutalist overflow-hidden"
        >
          <div className="border-b border-border bg-muted/10 px-6 py-5">
            <h2 className="text-xl font-semibold text-ink font-display">Quick Setup</h2>
            <p className="mt-1 text-sm text-muted-foreground">Share a few details before authorization.</p>
          </div>

          <div className="space-y-5 px-6 py-6">
            {data.intakeFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-semibold text-ink">
                  {field.label}
                  {field.required ? <span className="ml-1 text-coral">*</span> : null}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    value={intakeResponses[field.id] || ''}
                    onChange={(e) =>
                      setIntakeResponses((prev) => ({
                        ...prev,
                        [field.id]: e.target.value,
                      }))
                    }
                    required={field.required}
                    rows={4}
                    className="w-full"
                  />
                ) : field.type === 'dropdown' ? (
                  <select
                    value={intakeResponses[field.id] || ''}
                    onChange={(e) =>
                      setIntakeResponses((prev) => ({
                        ...prev,
                        [field.id]: e.target.value,
                      }))
                    }
                    required={field.required}
                    className="w-full"
                  >
                    <option value="">Select an option</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                    value={intakeResponses[field.id] || ''}
                    onChange={(e) =>
                      setIntakeResponses((prev) => ({
                        ...prev,
                        [field.id]: e.target.value,
                      }))
                    }
                    required={field.required}
                    className="w-full"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-border bg-muted/10 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-4 w-4" />
              Official OAuth only. Credentials are never requested.
            </div>
            <Button type="submit" variant="primary">
              Continue
            </Button>
          </div>
        </form>
      )}

      {phase === 'platforms' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card px-5 py-4">
            <h2 className="text-lg font-semibold text-ink font-display">
              {requestedPlatforms.length - completedPlatforms.size === 0
                ? 'All platforms connected'
                : `Connect ${requestedPlatforms.length - completedPlatforms.size} more platform${
                    requestedPlatforms.length - completedPlatforms.size !== 1 ? 's' : ''
                  }`}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {completedPlatforms.size} of {requestedPlatforms.length} complete
            </p>
          </div>

          {data.platforms.map((groupConfig) => {
            const platform = groupConfig.platformGroup as Platform;
            const isOAuthReturning = oauthConnectionInfo?.platform === platform;

            if (completedPlatforms.has(platform)) {
              return (
                <div key={platform} className="rounded-lg border border-teal/40 bg-teal/10 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-ink font-display">{PLATFORM_NAMES[platform]}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Connected</p>
                    </div>
                    <Check className="h-5 w-5 text-teal" />
                  </div>
                </div>
              );
            }

            return (
              <PlatformAuthWizard
                key={platform}
                platform={platform}
                platformName={PLATFORM_NAMES[platform]}
                products={groupConfig.products}
                accessRequestToken={token}
                onComplete={() => handlePlatformComplete(platform)}
                initialConnectionId={isOAuthReturning ? oauthConnectionInfo.connectionId : undefined}
                initialStep={isOAuthReturning ? 2 : undefined}
              />
            );
          })}
        </div>
      )}

      {phase === 'complete' && (
        <div className="rounded-lg border-2 border-black bg-card p-8 shadow-brutalist text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-teal bg-teal/10">
            <Check className="h-8 w-8 text-teal" />
          </div>

          <h2 className="text-2xl font-semibold text-ink font-display">All set</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {data.agencyName} now has access to the accounts you approved.
          </p>

          <div className="mt-6 rounded-lg border border-border bg-muted/10 p-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Connected Platforms</p>
            <p className="mt-2 text-sm text-ink">
              {Array.from(completedPlatforms)
                .map((platform) => PLATFORM_NAMES[platform])
                .join(', ') || 'No platforms connected'}
            </p>
          </div>

          {completionError ? (
            <div className="mt-4 rounded-lg border border-coral/30 bg-coral/10 p-4 text-left">
              <p className="text-sm text-coral">{completionError}</p>
              <Button
                className="mt-3"
                variant="secondary"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                onClick={handleRetryComplete}
              >
                Retry Finalization
              </Button>
            </div>
          ) : null}

          <p className="mt-6 text-xs text-muted-foreground">You can now close this window.</p>
        </div>
      )}
    </InviteFlowShell>
  );
}
