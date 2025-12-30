'use client';

/**
 * PlatformAuthWizard - Main 3-step wizard for platform authorization
 *
 * Steps:
 * 1. Connect: OAuth authorization button
 * 2. Select Assets: MetaAssetSelector with asset fetching
 * 3. Connected: Success confirmation with granted assets list
 *
 * State Management:
 * - currentStep: tracks wizard progress
 * - sessionId: from OAuth callback, used for asset fetching
 * - selectedAssets: assets chosen by client
 * - grantedAssets: confirmation from backend after grant
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { PlatformWizardCard } from './PlatformWizardCard';
import type { Platform } from '@agency-platform/shared';

interface PlatformAuthWizardProps {
  platform: Platform;
  platformName: string;
  accessRequestToken: string;
  onComplete: () => void;
}

export function PlatformAuthWizard({
  platform,
  platformName,
  accessRequestToken,
  onComplete,
}: PlatformAuthWizardProps) {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [assets, setAssets] = useState<any>(null);
  const [isFetchingAssets, setIsFetchingAssets] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for OAuth callback (connectionId in URL)
  useEffect(() => {
    const urlConnectionId = searchParams.get('connectionId');
    const urlPlatform = searchParams.get('platform');
    const urlStep = searchParams.get('step');

    if (urlConnectionId && urlPlatform === platform && urlStep === '2') {
      setConnectionId(urlConnectionId);
      setCurrentStep(2);

      // Fetch assets for display (optional)
      fetchAssetsForDisplay(urlConnectionId);
    }
  }, [searchParams, platform]);

  // Fetch assets to display what client authorized (optional)
  const fetchAssetsForDisplay = async (connId: string) => {
    try {
      setIsFetchingAssets(true);
      const response = await fetch(`/api/client-assets/${connId}/${platform}`);
      const json = await response.json();

      if (!json.error) {
        setAssets(json.data);
      }
    } catch (err) {
      // Silently fail - assets display is optional
      console.warn('Failed to fetch assets for display:', err);
    } finally {
      setIsFetchingAssets(false);
    }
  };

  // Step 1: Initiate OAuth
  const handleConnectClick = async () => {
    try {
      // Create OAuth state token
      const response = await fetch(`/api/client/${accessRequestToken}/oauth-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || 'Failed to create OAuth state');
      }

      const { state } = json.data;

      // Redirect to OAuth URL
      window.location.href = `/oauth/${platform}?state=${state}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate OAuth');
    }
  };


  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
              <span className="text-4xl">🔗</span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 mb-3">
                Connect {platformName}
              </h3>
              <p className="text-lg text-slate-600 max-w-md mx-auto">
                Click the button below to authorize your {platformName} account. You'll be redirected to {platformName} to log in and approve access.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleConnectClick}
              className="inline-flex items-center gap-3 px-8 py-4 bg-trust text-white font-bold text-lg rounded-xl hover:bg-amber-600 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Connect {platformName}
              <ExternalLink className="w-5 h-5" />
            </button>
          </div>
        );

      case 2:
        return (
          <div className="text-center space-y-6 py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100 mb-4"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-600" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-4xl font-bold text-slate-900 mb-3">
                Successfully Connected!
              </h3>
              <p className="text-lg text-slate-600 max-w-md mx-auto">
                The agency now has access to your {platformName} account
              </p>
            </motion.div>

            {/* Assets Summary (optional display) */}
            {isFetchingAssets ? (
              <div className="flex items-center justify-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading asset details...</span>
              </div>
            ) : assets ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 text-left max-w-md mx-auto"
              >
                <h4 className="font-bold text-emerald-900 mb-3">
                  Authorized Access To:
                </h4>
                <ul className="space-y-2">
                  {assets.adAccounts?.length > 0 && (
                    <li className="text-emerald-800">
                      ✓ {assets.adAccounts.length} Ad Account{assets.adAccounts.length !== 1 ? 's' : ''}
                    </li>
                  )}
                  {assets.pages?.length > 0 && (
                    <li className="text-emerald-800">
                      ✓ {assets.pages.length} Page{assets.pages.length !== 1 ? 's' : ''}
                    </li>
                  )}
                  {assets.instagramAccounts?.length > 0 && (
                    <li className="text-emerald-800">
                      ✓ {assets.instagramAccounts.length} Instagram Account{assets.instagramAccounts.length !== 1 ? 's' : ''}
                    </li>
                  )}
                </ul>
              </motion.div>
            ) : null}

            <button
              onClick={onComplete}
              className="px-8 py-4 bg-emerald-600 text-white font-bold text-lg rounded-xl hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Continue to Next Platform →
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PlatformWizardCard
      platform={platform}
      platformName={platformName}
      currentStep={currentStep}
    >
      {renderStepContent()}
    </PlatformWizardCard>
  );
}
