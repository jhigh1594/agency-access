'use client';

/**
 * UsageWidget Component
 *
 * Displays current usage metrics for the agency's subscription tier.
 * Shows progress bars for client onboards, platform audits, and team seats.
 * Includes upgrade prompts when approaching limits.
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { UsageSnapshot, MetricUsage } from '@agency-platform/shared';
import { Loader2, AlertCircle } from 'lucide-react';

export function UsageWidget() {
  const { userId } = useAuth();
  const { data: usage, isLoading, error } = useQuery({
    queryKey: ['usage', userId],
    queryFn: async () => {
      const response = await fetch('/api/usage');
      const json = await response.json();
      return json.data as UsageSnapshot;
    },
    enabled: !!userId,
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-3 text-slate-600">Loading usage...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Failed to load usage data</span>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!usage) {
    return null;
  }

  const { metrics, tierName } = usage;
  const shouldShowUpgradePrompt =
    metrics.clientOnboards.percentage >= 80 ||
    metrics.platformAudits.percentage >= 80 ||
    metrics.teamSeats.percentage >= 80;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Usage</h3>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
          {tierName}
        </span>
      </div>

      {/* Metrics */}
      <div className="space-y-5">
        <MetricBar
          label="Client Onboards"
          metric={usage.metrics.clientOnboards}
        />
        <MetricBar
          label="Platform Audits"
          metric={usage.metrics.platformAudits}
        />
        <MetricBar
          label="Team Seats"
          metric={usage.metrics.teamSeats}
        />
      </div>

      {/* Upgrade Prompt */}
      {shouldShowUpgradePrompt && <UpgradePrompt currentTier={usage.tier} />}
    </div>
  );
}

function MetricBar({ label, metric }: { label: string; metric: MetricUsage }) {
  const getColor = () => {
    if (metric.isUnlimited) return 'bg-green-500';
    if (metric.percentage >= 100) return 'bg-red-500';
    if (metric.percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const width = metric.isUnlimited ? 100 : Math.min(metric.percentage, 100);

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-700 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {metric.isUnlimited ? (
            <>
              <span className="text-slate-500">{metric.used} used</span>
              <span className="text-xs text-green-600 font-medium">unlimited</span>
            </>
          ) : (
            <span className="text-slate-500">{metric.used} of {metric.limit} used</span>
          )}
        </div>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2">
        <div
          className={`${getColor()} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${width}%` }}
          role="progressbar"
          aria-valuenow={metric.used}
          aria-valuemin={0}
          aria-valuemax={metric.limit}
          aria-label={`${label} usage`}
        />
      </div>
      {!metric.isUnlimited && metric.resetsAt && (
        <p className="text-xs text-slate-400 mt-1">
          Resets {metric.resetsAt.toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

function UpgradePrompt({ currentTier }: { currentTier: string }) {
  const nextTier = currentTier === 'STARTER' ? 'AGENCY' : 'PRO';

  return (
    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-sm text-yellow-800 mb-2">
        You&apos;re approaching your limit. Upgrade to <strong>{nextTier}</strong> for more capacity.
      </p>
      <a
        href={`/pricing?upgrade=${nextTier}`}
        className="text-sm font-medium text-yellow-900 hover:text-yellow-700 underline"
      >
        View plans →
      </a>
    </div>
  );
}
