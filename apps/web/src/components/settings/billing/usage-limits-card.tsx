'use client';

/**
 * Usage Limits Card
 *
 * Shows usage progress bars with upgrade nudges at 80%.
 */

import { TrendingUp, Loader2 } from 'lucide-react';
import { useTierDetails, useCreateCheckout } from '@/lib/query/billing';

export function UsageLimitsCard() {
  const { data: tierDetails, isLoading } = useTierDetails();
  const createCheckout = useCreateCheckout();

  if (isLoading) {
    return (
      <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Usage This Month</h2>
            <p className="text-sm text-slate-600">Track your plan usage</p>
          </div>
        </div>
        <div className="py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
        </div>
      </section>
    );
  }

  const limits = tierDetails?.limits;
  const currentTier = tierDetails?.tier || 'STARTER';

  const handleUpgrade = async () => {
    const nextTier = currentTier === 'STARTER' ? 'PRO' : 'ENTERPRISE';
    const result = await createCheckout.mutateAsync({
      tier: nextTier,
      successUrl: `${window.location.origin}/settings?tab=billing&checkout=success`,
      cancelUrl: `${window.location.origin}/settings?tab=billing&checkout=cancel`,
    });
    window.location.href = result.checkoutUrl;
  };

  const renderProgressBar = (
    used: number,
    limit: number | 'unlimited',
    label: string
  ) => {
    const isUnlimited = limit === 'unlimited' || limit === -1;
    const numericLimit = isUnlimited ? 0 : (limit as number);
    const percentage = isUnlimited ? 0 : Math.min((used / numericLimit) * 100, 100);
    const isNearLimit = !isUnlimited && percentage >= 80;
    const isAtLimit = !isUnlimited && used >= numericLimit;

    return (
      <div key={label} className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-700 capitalize">{label}</span>
          <span
            className={`font-medium ${
              isAtLimit
                ? 'text-red-600'
                : isNearLimit
                  ? 'text-yellow-600'
                  : 'text-slate-900'
            }`}
          >
            {isUnlimited ? 'Unlimited' : `${used} / ${numericLimit}`}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit
                ? 'bg-red-500'
                : isNearLimit
                  ? 'bg-yellow-500'
                  : 'bg-indigo-500'
            }`}
            style={{ width: isUnlimited ? '0%' : `${percentage}%` }}
          />
        </div>
        {!isUnlimited && isNearLimit && (
          <p className={`text-xs ${isAtLimit ? 'text-red-600' : 'text-yellow-600'}`}>
            {isAtLimit
              ? 'Limit reached. Upgrade to continue.'
              : `${numericLimit - used} remaining. Consider upgrading soon.`}
          </p>
        )}
      </div>
    );
  };

  const showUpgradeNudge =
    limits &&
    currentTier !== 'ENTERPRISE' &&
    ((limits.accessRequests.limit !== 'unlimited' &&
      limits.accessRequests.used / (limits.accessRequests.limit as number) >= 0.8) ||
      (limits.clients.limit !== 'unlimited' &&
        limits.clients.used / (limits.clients.limit as number) >= 0.8));

  return (
    <section className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Usage This Month</h2>
          <p className="text-sm text-slate-600">Track your plan usage</p>
        </div>
      </div>

      {limits && (
        <div className="space-y-4">
          {renderProgressBar(
            limits.accessRequests.used,
            limits.accessRequests.limit,
            'access requests'
          )}
          {renderProgressBar(limits.clients.used, limits.clients.limit, 'clients')}
          {renderProgressBar(limits.members.used, limits.members.limit, 'team members')}
          {renderProgressBar(limits.templates.used, limits.templates.limit, 'templates')}
        </div>
      )}

      {showUpgradeNudge && (
        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-900">
                Running low on limits?
              </p>
              <p className="text-xs text-indigo-700">
                Upgrade to get more capacity and unlock premium features.
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={createCheckout.isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 transition-colors"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Upgrade
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
