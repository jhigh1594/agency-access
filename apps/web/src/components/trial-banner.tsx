'use client';

/**
 * TrialBanner
 *
 * Renders a dismissible warning banner when the user's trial has ≤3 days left.
 * Shown at the top of the authenticated layout, above page content.
 *
 * Props come from the parent layout which fetches subscription data.
 */

import { useState, useMemo } from 'react';
import { AlertCircle, X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TrialBannerProps {
  trialEnd: string; // ISO date string
  tierName: string; // e.g., "Growth" or "Scale"
}

export function TrialBanner({ trialEnd, tierName }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  const daysRemaining = useMemo(() => {
    const end = new Date(trialEnd);
    const now = new Date();
    const diffMs = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [trialEnd]);

  // Only show when 3 or fewer days remain
  if (dismissed || daysRemaining > 3) {
    return null;
  }

  const isExpired = daysRemaining === 0;

  const message = isExpired
    ? `Your ${tierName} trial has expired. Subscribe to keep your features.`
    : daysRemaining === 1
      ? `Your ${tierName} trial ends tomorrow. Subscribe now to avoid losing access.`
      : `Your ${tierName} trial ends in ${daysRemaining} days. Subscribe to keep your features.`;

  return (
    <div className={`relative flex items-center justify-between gap-4 px-4 py-3 text-sm ${
      isExpired
        ? 'bg-red-600 text-white'
        : 'bg-amber-500 text-white'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium truncate">{message}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => router.push('/settings')}
          className="inline-flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition-colors"
        >
          Subscribe Now
          <ArrowRight className="h-3 w-3" />
        </button>
        {!isExpired && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
