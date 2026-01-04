/**
 * Client Authorization Page
 *
 * The page clients see when they click an authorization link.
 * Branded per agency, guides through OAuth flow with intake form.
 *
 * Aesthetic: Bold & Confident with refined editorial touches
 * Large typography, warm trust colors, and per-platform wizards.
 *
 * Flow:
 * 1. Intake: Client fills form with business details
 * 2. Platforms: Stacked 3-step wizards per platform (Connect → Select → Connected)
 * 3. Complete: Success confirmation
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Check, X, Loader2, ChevronRight, Shield, Lock } from 'lucide-react';
import { PlatformIcon } from '@/components/ui';
import { PlatformAuthWizard } from '@/components/client-auth/PlatformAuthWizard';
import { PLATFORM_NAMES } from '@agency-platform/shared';
import type { Platform } from '@agency-platform/shared';

interface AuthorizationPageData {
  agencyName: string;
  clientName: string;
  clientEmail: string;
  platforms: Array<{
    platformGroup: Platform;
    products: Array<{
      product: string;
      accessLevel: string;
    }>;
  }>;
  intakeFields: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
  }>;
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    subdomain?: string;
  };
}

export default function ClientAuthorizationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = params.token as string;

  // Read URL params for OAuth callback flow
  const urlConnectionId = searchParams.get('connectionId');
  const urlPlatform = searchParams.get('platform') as Platform | null;
  const urlStep = searchParams.get('step');

  const [step, setStep] = useState<'loading' | 'intake' | 'platforms' | 'complete'>('loading');
  const [data, setData] = useState<AuthorizationPageData | null>(null);
  const [intakeResponses, setIntakeResponses] = useState<Record<string, string>>({});
  const [completedPlatforms, setCompletedPlatforms] = useState<Set<Platform>>(new Set());
  
  // Track OAuth connection info from callback
  const [oauthConnectionInfo, setOauthConnectionInfo] = useState<{
    connectionId: string;
    platform: Platform;
  } | null>(null);

  // Fetch access request data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/client/${token}`);
        const result = await res.json();

        if (result.error || !result.data) {
          // Show error state
          setStep('platforms'); // Will show error below
          return;
        }

        setData(result.data);
        
        // Check if returning from OAuth callback (step=2 in URL)
        if (urlStep === '2' && urlConnectionId && urlPlatform) {
          // Store connection info for the wizard
          setOauthConnectionInfo({
            connectionId: urlConnectionId,
            platform: urlPlatform,
          });
          // Skip intake, go directly to platforms step
          setStep('platforms');
        } else {
          setStep('intake');
        }
      } catch (err) {
        console.error('Failed to fetch access request:', err);
        setStep('platforms'); // Will show error
      }
    };

    fetchData();
  }, [token, urlStep, urlConnectionId, urlPlatform]);

  const handleIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('platforms');
  };

  const handlePlatformComplete = (platform: Platform) => {
    setCompletedPlatforms(new Set([...completedPlatforms, platform]));
  };

  const isComplete = () => {
    if (!data) return false;
    return data.platforms.every((p) => completedPlatforms.has(p.platformGroup));
  };

  // Show complete screen if all platforms processed
  useEffect(() => {
    if (step === 'platforms' && isComplete()) {
      setTimeout(() => setStep('complete'), 500);
    }
  }, [step, completedPlatforms, data]);

  // Loading state
  if (step === 'loading' || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state (expired/invalid token)
  if (step === 'platforms' && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Link expired
            </h1>
            <p className="text-slate-600 mb-6">
              This link is no longer valid. Contact your agency for a new one.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const branding = data.branding || {};
  const primaryColor = branding.primaryColor || '#6366f1';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="" className="h-6" />
              ) : (
                <span className="font-semibold text-slate-900">{data.agencyName}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {['Setup', 'Connect', 'Done'].map((label, i) => {
                const currentStep = step === 'intake' ? 0 : step === 'platforms' ? 1 : 2;
                const isActive = i <= currentStep;
                return (
                  <div key={label} className="flex items-center">
                    <span
                      className={isActive ? 'text-indigo-600 font-medium' : 'text-slate-400'}
                    >
                      {label}
                    </span>
                    {i < 2 && (
                      <ChevronRight className={`h-4 w-4 mx-1 ${isActive ? 'text-indigo-600' : 'text-slate-300'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Progress indicator */}
          <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500"
              style={{
                width: step === 'intake' ? '33%' : step === 'platforms' ? '66%' : '100%',
                backgroundColor: primaryColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Intake Form Step */}
          {step === 'intake' && (
            <form onSubmit={handleIntakeSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">Quick Setup</h2>
                <p className="text-slate-600 mt-1">
                  Share a few details about your business
                </p>
              </div>

              <div className="p-8 space-y-6">
                {data.intakeFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        value={intakeResponses[field.id] || ''}
                        onChange={(e) =>
                          setIntakeResponses({ ...intakeResponses, [field.id]: e.target.value })
                        }
                        required={field.required}
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                      />
                    ) : field.type === 'dropdown' ? (
                      <select
                        value={intakeResponses[field.id] || ''}
                        onChange={(e) =>
                          setIntakeResponses({ ...intakeResponses, [field.id]: e.target.value })
                        }
                        required={field.required}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white"
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                        value={intakeResponses[field.id] || ''}
                        onChange={(e) =>
                          setIntakeResponses({ ...intakeResponses, [field.id]: e.target.value })
                        }
                        required={field.required}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="px-8 pb-8">
                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: primaryColor }}
                >
                  Continue
                  <ChevronRight className="inline h-5 w-5 ml-2" />
                </button>
              </div>

              {/* Security Notice */}
              <div className="px-8 py-4 bg-slate-50 flex items-start gap-3">
                <Lock className="h-5 w-5 text-slate-500 mt-0.5" />
                <div className="text-sm text-slate-600">
                  <strong>Secure:</strong> Official OAuth only. We never see or store your passwords.
                </div>
              </div>
            </form>
          )}

          {/* Platform Authorization Wizards */}
          {step === 'platforms' && (
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {data.platforms.length - completedPlatforms.size === 0
                    ? 'All platforms connected'
                    : `Connect ${data.platforms.length - completedPlatforms.size} more platform${data.platforms.length - completedPlatforms.size !== 1 ? 's' : ''}`
                  }
                </h1>
                <p className="text-slate-600">
                  {completedPlatforms.size === 0
                    ? 'Start by connecting your first platform'
                    : completedPlatforms.size === data.platforms.length
                    ? 'You\'re all set'
                    : `${completedPlatforms.size} of ${data.platforms.length} complete`
                  }
                </p>
              </div>

              {/* Stacked Platform Wizards - one per group */}
              {data.platforms.map((groupConfig) => {
                const platform = groupConfig.platformGroup;
                const platformName = PLATFORM_NAMES[platform];
                
                // Check if this platform was just authenticated via OAuth callback
                const isOAuthReturning = oauthConnectionInfo?.platform === platform;

                return (
                  <PlatformAuthWizard
                    key={platform}
                    platform={platform}
                    platformName={platformName}
                    products={groupConfig.products}
                    accessRequestToken={token}
                    onComplete={() => handlePlatformComplete(platform)}
                    // Pass connection info if returning from OAuth
                    initialConnectionId={isOAuthReturning ? oauthConnectionInfo.connectionId : undefined}
                    initialStep={isOAuthReturning ? 2 : undefined}
                  />
                );
              })}
            </div>
          )}

          {/* Complete Step */}
          {step === 'complete' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-center">
              <div className="p-12">
                {/* Success Animation */}
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-emerald-600" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  All set
                </h1>
                <p className="text-slate-600 mb-8">
                  {data.agencyName} now has access to the accounts you selected. You can close this window.
                </p>

                {/* Summary */}
                <div className="bg-slate-50 rounded-xl p-6 text-left">
                  <h3 className="font-semibold text-slate-900 mb-4">Connected</h3>
                  <div className="space-y-2">
                    {completedPlatforms.size > 0 ? (
                      <div className="flex items-center gap-2 text-emerald-700">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">
                          {Array.from(completedPlatforms)
                            .map((p) => PLATFORM_NAMES[p])
                            .join(', ')}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">No platforms connected</p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-500 mt-8">
                  Questions? Contact {data.agencyName}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
