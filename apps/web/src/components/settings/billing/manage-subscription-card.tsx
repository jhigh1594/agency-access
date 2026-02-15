'use client';

/**
 * ManageSubscriptionCard Component
 *
 * Allows users to upgrade/downgrade their subscription tier
 * and cancel their subscription with proration options.
 */

import { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Info,
  Loader2,
  ChevronDown,
  X,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription, useUpgradeSubscription } from '@/lib/query/billing';
import { SUBSCRIPTION_TIER_NAMES, SUBSCRIPTION_TIER_DESCRIPTIONS, type SubscriptionTier } from '@agency-platform/shared';
import { CancelSubscriptionModal } from './cancel-subscription-modal';
import { Button } from '@/components/ui/button';

const TIERS: SubscriptionTier[] = ['STARTER', 'AGENCY', 'PRO'];

export function ManageSubscriptionCard() {
  const { data: subscription, isLoading } = useSubscription();
  const upgradeMutation = useUpgradeSubscription();

  const [showTierSelector, setShowTierSelector] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [updateBehavior, setUpdateBehavior] = useState<'immediate' | 'next-cycle'>('next-cycle');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <section className="clean-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-coral/10 rounded-lg">
            <Info className="h-5 w-5 text-coral" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Manage Subscription</h2>
            <p className="text-sm text-muted-foreground">Upgrade, downgrade, or cancel</p>
          </div>
        </div>
        <div className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
        </div>
      </section>
    );
  }

  const currentTier = subscription?.tier || 'STARTER';
  const isDowngrade = selectedTier && TIERS.indexOf(selectedTier) < TIERS.indexOf(currentTier);
  const isUpgrade = selectedTier && TIERS.indexOf(selectedTier) > TIERS.indexOf(currentTier);

  const handleTierChange = async () => {
    if (!selectedTier || selectedTier === currentTier) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await upgradeMutation.mutateAsync({
        newTier: selectedTier,
        updateBehavior,
      });

      setSuccessMessage(
        `Successfully ${isUpgrade ? 'upgraded' : 'downgraded'} to ${SUBSCRIPTION_TIER_NAMES[selectedTier]}`
      );
      setShowTierSelector(false);
      setSelectedTier(null);

      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update subscription');
    }
  };

  const getProrationExplanation = () => {
    if (updateBehavior === 'immediate') {
      return 'The prorated difference will be charged immediately, and your new billing cycle starts today.';
    }
    return 'The change will take effect at your next billing date. Any credit or charge will be applied to your next invoice.';
  };

  return (
    <section className="clean-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-coral/10 rounded-lg">
          <Info className="h-5 w-5 text-coral" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Manage Subscription</h2>
          <p className="text-sm text-muted-foreground">Upgrade, downgrade, or cancel your plan</p>
        </div>
      </div>

      {/* Success Message */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 p-3 bg-teal/10 border border-teal/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-teal flex-shrink-0" />
              <p className="text-sm text-teal">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto p-1 hover:bg-teal/20 rounded"
              >
                <X className="h-4 w-4 text-teal" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 p-3 bg-coral/10 border border-coral/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-coral flex-shrink-0" />
              <p className="text-sm text-coral">{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className="ml-auto p-1 hover:bg-coral/20 rounded"
              >
                <X className="h-4 w-4 text-coral" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tier Selector */}
      {!showTierSelector ? (
        <div className="space-y-4">
          <div className="p-4 bg-card rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Change your subscription plan at any time. Prorated charges or credits will apply.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() => setShowTierSelector(true)}
              >
                <ArrowUp className="h-4 w-4" />
                Change Plan
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-card rounded-lg border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-ink">Select New Plan</h3>
              <button
                onClick={() => {
                  setShowTierSelector(false);
                  setSelectedTier(null);
                  setErrorMessage(null);
                }}
                className="p-1 hover:bg-electric/10 rounded"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Tier Options */}
            <div className="space-y-2 mb-4">
              {TIERS.map((tier) => {
                const isSelected = selectedTier === tier;
                const isCurrent = tier === currentTier;
                const tierName = SUBSCRIPTION_TIER_NAMES[tier];
                const tierInfo = SUBSCRIPTION_TIER_DESCRIPTIONS[tier];
                const isUpgradeOption = TIERS.indexOf(tier) > TIERS.indexOf(currentTier);
                const isDowngradeOption = TIERS.indexOf(tier) < TIERS.indexOf(currentTier);

                return (
                  <button
                    key={tier}
                    onClick={() => !isCurrent && setSelectedTier(tier)}
                    disabled={isCurrent}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      isCurrent
                        ? 'border-border bg-muted opacity-60 cursor-not-allowed'
                        : isSelected
                        ? isUpgradeOption
                        ? 'border-teal bg-teal/10 ring-2 ring-teal/20'
                        : 'border-acid bg-acid/10 ring-2 ring-acid/20'
                        : 'border-border bg-card hover:border-coral/30 hover:bg-coral/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-ink">{tierName}</span>
                          {isCurrent && (
                            <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
                              Current
                            </span>
                          )}
                          {isUpgradeOption && !isCurrent && (
                            <span className="text-xs px-2 py-0.5 bg-teal/10 text-teal rounded-full flex items-center gap-1">
                              <ArrowUp className="h-3 w-3" />
                              Upgrade
                            </span>
                          )}
                          {isDowngradeOption && !isCurrent && (
                            <span className="text-xs px-2 py-0.5 bg-acid/10 text-acid rounded-full flex items-center gap-1">
                              <ArrowDown className="h-3 w-3" />
                              Downgrade
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">${tierInfo.price.monthly}/month</p>
                      </div>
                      {isSelected && (
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isUpgradeOption ? 'border-teal' : 'border-acid'
                        }`}>
                          <div className={`w-3 h-3 rounded-full ${
                            isUpgradeOption ? 'bg-teal' : 'bg-acid'
                          }`} />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Proration Options */}
            {selectedTier && selectedTier !== currentTier && (
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-ink mb-3">When should this change take effect?</h4>
                <div className="space-y-2 mb-4">
                  <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    updateBehavior === 'next-cycle'
                      ? 'border-coral bg-coral/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}>
                    <input
                      type="radio"
                      name="updateBehavior"
                      value="next-cycle"
                      checked={updateBehavior === 'next-cycle'}
                      onChange={(e) => setUpdateBehavior(e.target.value as 'immediate' | 'next-cycle')}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-ink">Next billing cycle (Recommended)</p>
                      <p className="text-sm text-muted-foreground">{getProrationExplanation()}</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    updateBehavior === 'immediate'
                      ? 'border-coral bg-coral/10'
                      : 'border-border hover:border-muted-foreground'
                  }`}>
                    <input
                      type="radio"
                      name="updateBehavior"
                      value="immediate"
                      checked={updateBehavior === 'immediate'}
                      onChange={(e) => setUpdateBehavior(e.target.value as 'immediate' | 'next-cycle')}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-ink">Immediately</p>
                      <p className="text-sm text-muted-foreground">
                        {updateBehavior === 'immediate' ? getProrationExplanation() : 'The prorated difference will be charged immediately.'}
                      </p>
                    </div>
                  </label>
                </div>

                {/* Summary */}
                <div className="p-3 bg-coral/5 border border-coral/20 rounded-lg mb-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-coral flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-coral">
                      <p className="font-semibold mb-1">
                        {isUpgrade ? 'Upgrade' : 'Downgrade'} to {SUBSCRIPTION_TIER_NAMES[selectedTier]}
                      </p>
                      <p>{getProrationExplanation()}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedTier(null)}
                disabled={upgradeMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant={isUpgrade ? 'success' : 'warning'}
                onClick={handleTierChange}
                disabled={upgradeMutation.isPending}
              >
                {upgradeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isUpgrade ? (
                      <>
                        <ArrowUp className="h-4 w-4" />
                        Upgrade Now
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-4 w-4" />
                        Downgrade Now
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        currentTier={currentTier}
      />
    </section>
  );
}
