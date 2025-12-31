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

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ExternalLink, CheckCircle2, ChevronDown } from 'lucide-react';
import { PlatformWizardCard } from './PlatformWizardCard';
import { MetaAssetSelector } from './MetaAssetSelector';
import { GoogleAdsAssetSelector } from './GoogleAdsAssetSelector';
import { GA4AssetSelector } from './GA4AssetSelector';
import { GoogleAssetSelector } from './GoogleAssetSelector';
import { AutomaticPagesGrant } from './AutomaticPagesGrant';
import { AdAccountSharingInstructions } from './AdAccountSharingInstructions';
import { PlatformIcon, PLATFORM_CONFIG } from '@/components/ui';
import type { Platform } from '@agency-platform/shared';

interface PlatformAuthWizardProps {
  platform: Platform;
  platformName: string;
  products: Array<{ product: string; accessLevel: string }>;
  accessRequestToken: string;
  onComplete: () => void;
  // Optional initial values from OAuth callback
  initialConnectionId?: string;
  initialStep?: 1 | 2 | 3;
}

export function PlatformAuthWizard({
  platform,
  platformName,
  products,
  accessRequestToken,
  onComplete,
  initialConnectionId,
  initialStep,
}: PlatformAuthWizardProps) {
  // Initialize with props if returning from OAuth callback
  // All platforms use 3 steps: Connect → Choose Accounts & Grant Access → Done
  const metaNeedsGrantStep = platform === 'meta' && products.some(
    (p) => p.product === 'meta_ads'
  );
  const maxSteps = 3;
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(initialStep ? (initialStep > 3 ? 3 : initialStep as 1 | 2 | 3) : 1);
  const [connectionId, setConnectionId] = useState<string | null>(initialConnectionId || null);
  const [groupAssets, setGroupAssets] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [businessIdLoading, setBusinessIdLoading] = useState(false);
  const [businessIdError, setBusinessIdError] = useState<string | null>(null);
  const [pagesGranted, setPagesGranted] = useState(false);
  const [adAccountsShared, setAdAccountsShared] = useState(false);
  const [assetsSaved, setAssetsSaved] = useState(false);
  const [chooseAccountsExpanded, setChooseAccountsExpanded] = useState(true);
  const [grantAccessExpanded, setGrantAccessExpanded] = useState(true);

  // Step 1: Initiate OAuth
  const handleConnectClick = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      // Get OAuth authorization URL from backend
      const response = await fetch(`/api/client/${accessRequestToken}/oauth-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || 'Failed to generate OAuth URL');
      }

      const { authUrl } = json.data;

      // Redirect to external OAuth provider
      window.location.href = authUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate OAuth');
      setIsProcessing(false);
    }
  };

  // Update selection for a specific product in the group
  const handleProductSelectionChange = useCallback((product: string, selectedAssets: any) => {
    setGroupAssets((prev) => ({
      ...prev,
      [product]: selectedAssets,
    }));
  }, []);

  // Fetch Business Manager ID for Meta
  useEffect(() => {
    if (platform === 'meta' && currentStep >= 2 && !businessId && !businessIdLoading) {
      const fetchBusinessId = async () => {
        setBusinessIdLoading(true);
        setBusinessIdError(null);
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const response = await fetch(`${apiUrl}/api/client/${accessRequestToken}/agency-business-id`);
          const json = await response.json();
          
          if (json.error) {
            setBusinessIdError(json.error.message || 'Failed to load Business Manager ID');
          } else if (json.data) {
            setBusinessId(json.data.businessId);
            setBusinessName(json.data.businessName || null);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch Business Manager ID';
          setBusinessIdError(errorMessage);
          console.error('Failed to fetch Business Manager ID:', error);
        } finally {
          setBusinessIdLoading(false);
        }
      };
      fetchBusinessId();
    }
  }, [platform, currentStep, accessRequestToken, businessId, businessIdLoading]);

  // Step 2: Handle batch save for all products in the group
  const handleBatchSave = async () => {
    if (!connectionId) return;

    try {
      setIsProcessing(true);
      setError(null);

      // Save assets for each product in the group
      // We'll iterate through products and save them
      const savePromises = products.map((p) => {
        const selectedAssets = groupAssets[p.product] || {};
        return fetch(`/api/client/${accessRequestToken}/save-assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectionId,
            platform: p.product, // Product-level ID for saving
            selectedAssets,
          }),
        });
      });

      const responses = await Promise.all(savePromises);
      
      for (const response of responses) {
        const json = await response.json();
        if (json.error) {
          throw new Error(json.error.message || 'Failed to save some selected assets');
        }
      }

      // Mark assets as saved
      setAssetsSaved(true);
      // Collapse "Choose Accounts" section after saving
      setChooseAccountsExpanded(false);
      // Expand "Grant Access" section if needed
      if (metaNeedsGrantStep) {
        const metaAssets = groupAssets['meta_ads'] || {};
        const hasPages = (metaAssets.pages?.length ?? 0) > 0;
        const hasAdAccounts = (metaAssets.adAccounts?.length ?? 0) > 0;
        if (hasPages || hasAdAccounts) {
          setGrantAccessExpanded(true);
        }
      }

      // After saving, stay on step 2 to show grant access UI (for Meta) or go to final step
      // For Meta with pages/ad accounts, grant access is shown in step 2
      // For other platforms or Meta without grant needs, go to final step
      if (metaNeedsGrantStep) {
        const metaAssets = groupAssets['meta_ads'] || {};
        const hasPages = (metaAssets.pages?.length ?? 0) > 0;
        const hasAdAccounts = (metaAssets.adAccounts?.length ?? 0) > 0;
        
        // Stay on step 2 to show grant access UI
        if (hasPages || hasAdAccounts) {
          // Already on step 2, grant access UI will appear below
        } else {
          setCurrentStep(3);
        }
      } else {
        setCurrentStep(3);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save assets');
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if any assets are selected in the group
  const hasGroupSelections = () => {
    return Object.values(groupAssets).some((assets: any) => {
      return (
        (assets.adAccounts?.length ?? 0) > 0 ||
        (assets.pages?.length ?? 0) > 0 ||
        (assets.instagramAccounts?.length ?? 0) > 0 ||
        (assets.properties?.length ?? 0) > 0
      );
    });
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
                Sign in to {platformName} and approve access. You'll choose which accounts to share next.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleConnectClick}
              disabled={isProcessing}
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-bold text-lg rounded-xl border-2 border-slate-300 hover:bg-amber-500 hover:text-white hover:border-amber-500 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect {platformName}
                  <ExternalLink className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-12">
            {/* Choose Accounts Section - Collapsible */}
            <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setChooseAccountsExpanded(!chooseAccountsExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="text-left">
                  <h3 className="text-2xl font-bold text-slate-900">
                Choose accounts to share
              </h3>
                  <p className="text-sm text-slate-600 mt-1">
                Select the specific accounts you want to share.
              </p>
            </div>
                <motion.div
                  animate={{ rotate: chooseAccountsExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-6 h-6 text-slate-600" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {chooseAccountsExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 space-y-6">
            {error && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-16">
              {/* Show all products that require asset selection */}
              {products
                .filter((p) => {
                  // Show Meta products and all Google products
                  return p.product === 'meta_ads' || p.product.startsWith('google_') || p.product === 'ga4';
                })
                .map((p) => {
                  // Map product IDs to display names (some products aren't in PLATFORM_CONFIG)
                  const productNameMap: Record<string, string> = {
                    'google_ads': 'Google Ads',
                    'ga4': 'Google Analytics',
                    'google_tag_manager': 'Google Tag Manager',
                    'google_search_console': 'Google Search Console',
                    'google_merchant_center': 'Google Merchant Center',
                    'google_business_profile': 'Google Business Profile',
                    'meta_ads': 'Meta Ads',
                  };
                  const productName = PLATFORM_CONFIG[p.product as Platform]?.name || productNameMap[p.product] || p.product;
                  
                  return (
                    <div key={p.product} className="space-y-6">
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <PlatformIcon platform={p.product as Platform} size="sm" />
                        <h4 className="text-xl font-bold text-slate-800">{productName}</h4>
                      </div>

                      {p.product === 'meta_ads' && (
                        <MetaAssetSelector
                          sessionId={connectionId!}
                          onSelectionChange={(selectedAssets) => {
                            // Store both IDs and full asset objects for grant step
                            // selectedAssets now includes selectedPagesWithNames, etc. from MetaAssetSelector
                            handleProductSelectionChange(p.product, selectedAssets);
                          }}
                          onError={setError}
                        />
                      )}

                      {/* Use generic GoogleAssetSelector for all Google products */}
                      {(p.product.startsWith('google_') || p.product === 'ga4') && (
                        <GoogleAssetSelector
                          sessionId={connectionId!}
                          product={p.product}
                          onSelectionChange={(assets) => handleProductSelectionChange(p.product, assets)}
                          onError={setError}
                        />
                      )}
                    </div>
                  );
                })}
            </div>

                        {/* Unified Batch Save Button - only show if assets haven't been saved yet */}
                        {!assetsSaved && !isProcessing && hasGroupSelections() && (
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t-2 border-slate-200 p-8 -mx-8 -mb-8 mt-12 flex justify-center">
              <button
                onClick={handleBatchSave}
                disabled={isProcessing || !hasGroupSelections()}
                className={`
                  px-12 py-5 rounded-2xl font-bold text-xl transition-all duration-200 flex items-center gap-3
                  ${
                    hasGroupSelections()
                      ? 'bg-white text-slate-900 border-2 border-slate-300 hover:bg-amber-500 hover:text-white hover:border-amber-500 shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border-2 border-slate-200'
                  }
                `}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Confirm selection
                    <CheckCircle2 className="w-6 h-6" />
                  </>
                )}
              </button>
            </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
          </div>

            {/* Grant Access Section (for Meta after assets are saved) - Collapsible */}
            {platform === 'meta' && metaNeedsGrantStep && connectionId && assetsSaved && (() => {
          const metaAssets = groupAssets['meta_ads'] || {};
          const selectedPages = metaAssets.selectedPagesWithNames || 
            (metaAssets.pages || []).map((id: string) => {
              const allPages = metaAssets.allPages || [];
              const page = allPages.find((p: any) => p.id === id);
              return { id, name: page?.name || id };
            });
          const selectedAdAccounts = metaAssets.selectedAdAccountsWithNames ||
            (metaAssets.adAccounts || []).map((id: string) => {
              const allAdAccounts = metaAssets.allAdAccounts || [];
              const account = allAdAccounts.find((a: any) => a.id === id);
              return { id, name: account?.name || id };
            });
          const hasPages = selectedPages.length > 0;
          const hasAdAccounts = selectedAdAccounts.length > 0;

              // Only show grant access UI if there are pages or ad accounts
              if (!hasPages && !hasAdAccounts) {
                return null;
              }

          return (
                <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setGrantAccessExpanded(!grantAccessExpanded)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="text-left">
                      <h3 className="text-2xl font-bold text-slate-900">
                        Grant access
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Complete the steps below to grant access to your selected accounts.
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: grantAccessExpanded ? 0 : -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-6 h-6 text-slate-600" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {grantAccessExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="p-6">

                  {/* Show error banner if Business Manager ID is missing */}
                  {businessIdError && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 mb-6">
                      <p className="font-semibold">{businessIdError}</p>
                    </div>
                  )}
                  
              {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 mb-6">
                  {error}
                </div>
              )}

              {hasPages && (
                <AutomaticPagesGrant
                  selectedPages={selectedPages}
                  accessLevel="Admin"
                      connectionId={connectionId}
                  accessRequestToken={accessRequestToken}
                  onGrantComplete={(results) => {
                    setPagesGranted(results.some((r) => r.status === 'granted'));
                    // If ad accounts also need sharing, wait; otherwise advance
                    if (!hasAdAccounts || adAccountsShared) {
                          setCurrentStep(3);
                    }
                  }}
                  onError={setError}
                />
              )}

              {hasAdAccounts && businessId && (
                    <div className={hasPages ? 'mt-8' : ''}>
                  <AdAccountSharingInstructions
                    businessId={businessId}
                    businessName={businessName || undefined}
                    selectedAdAccounts={selectedAdAccounts}
                    accessRequestToken={accessRequestToken}
                        connectionId={connectionId}
                    onComplete={() => {
                      setAdAccountsShared(true);
                      // If pages also need granting, wait; otherwise advance
                      if (!hasPages || pagesGranted) {
                            setCurrentStep(3);
                      }
                    }}
                    onError={setError}
                  />
                </div>
              )}

              {hasAdAccounts && !businessId && (
                    <div className={`border-2 rounded-xl p-6 ${
                      businessIdError 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      {businessIdLoading ? (
                        <p className="text-amber-800 flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading Business Manager ID...
                        </p>
                      ) : businessIdError ? (
                        <div className="space-y-2">
                          <p className="text-red-800 font-semibold">Error loading Business Manager ID</p>
                          <p className="text-red-700 text-sm">{businessIdError}</p>
                        </div>
                      ) : (
                  <p className="text-amber-800">
                    Loading Business Manager ID...
                  </p>
                      )}
                    </div>
                  )}

                          {/* Continue button when both are complete */}
                          {(pagesGranted || !hasPages) && (adAccountsShared || !hasAdAccounts) && (
                            <div className="mt-8 flex justify-center">
                              <button
                                onClick={() => setCurrentStep(3)}
                                className="px-12 py-5 rounded-2xl font-bold text-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-3"
                              >
                                Continue
                                <CheckCircle2 className="w-6 h-6" />
                              </button>
                </div>
              )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}
            </div>
          );

      case 3:
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
                Connected
              </h3>
              <p className="text-lg text-slate-600 max-w-md mx-auto">
                Access granted to the accounts you selected.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {Object.entries(groupAssets).map(([product, assets]) => {
                // Map product IDs to display names (some products aren't in PLATFORM_CONFIG)
                const productNameMap: Record<string, string> = {
                  'google_ads': 'Google Ads',
                  'ga4': 'Google Analytics',
                  'google_tag_manager': 'Google Tag Manager',
                  'google_search_console': 'Google Search Console',
                  'google_merchant_center': 'Google Merchant Center',
                  'google_business_profile': 'Google Business Profile',
                  'meta_ads': 'Meta Ads',
                };
                const productName = PLATFORM_CONFIG[product as Platform]?.name || productNameMap[product] || product;
                
                return (
                  <motion.div
                    key={product}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 text-left"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <PlatformIcon platform={product as Platform} size="sm" />
                      <h4 className="font-bold text-emerald-900">{productName}</h4>
                    </div>
                    <ul className="space-y-1 text-sm">
                      {assets.adAccounts?.length > 0 && (
                        <li className="text-emerald-800">✓ {assets.adAccounts.length} Ad Accounts</li>
                      )}
                      {assets.pages?.length > 0 && (
                        <li className="text-emerald-800">✓ {assets.pages.length} Pages</li>
                      )}
                      {assets.instagramAccounts?.length > 0 && (
                        <li className="text-emerald-800">✓ {assets.instagramAccounts.length} IG Accounts</li>
                      )}
                      {assets.properties?.length > 0 && (
                        <li className="text-emerald-800">✓ {assets.properties.length} Properties</li>
                      )}
                    </ul>
                  </motion.div>
                );
              })}
            </div>

            <button
              onClick={onComplete}
              className="px-12 py-4 mt-8 bg-emerald-600 text-white font-bold text-lg rounded-xl hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
                  Next platform →
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
      totalSteps={maxSteps}
    >
      {renderStepContent()}
    </PlatformWizardCard>
  );
}
