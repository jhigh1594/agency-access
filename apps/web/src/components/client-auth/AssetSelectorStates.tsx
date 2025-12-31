'use client';

/**
 * AssetSelectorStates - Loading, empty, and error states for asset selectors
 *
 * Provides consistent state displays:
 * - Loading skeleton with animation
 * - Empty state with helpful messaging
 * - Error state with retry option
 */

import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================
// Loading Skeleton State
// ============================================
interface AssetSelectorLoadingProps {
  message?: string;
}

export function AssetSelectorLoading({
  message = 'Loading your accounts...',
}: AssetSelectorLoadingProps) {
  return (
    <div className="space-y-4 py-8">
      {/* Animated skeleton items */}
      <div className="space-y-3 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
        <div className="h-4 bg-slate-200 rounded w-5/6" />
      </div>

      {/* Loading message */}
      <div className="flex items-center justify-center gap-2 text-slate-600">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}

// ============================================
// Empty State
// ============================================
interface AssetSelectorEmptyProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AssetSelectorEmpty({
  title = 'No accounts found',
  description = 'We couldn\'t find any accounts for this platform. You may need to create one first.',
  actionLabel,
  onAction,
}: AssetSelectorEmptyProps) {
  return (
    <div className="py-12 text-center px-6">
      {/* Empty state icon */}
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <span className="text-4xl" role="img" aria-label="Empty">
          📭
        </span>
      </div>

      {/* Message */}
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 mb-4 max-w-sm mx-auto">{description}</p>

      {/* Optional action button */}
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ============================================
// Error State
// ============================================
interface AssetSelectorErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function AssetSelectorError({
  title = 'Error loading accounts',
  message,
  onRetry,
  retryLabel = 'Try again',
}: AssetSelectorErrorProps) {
  return (
    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 my-4">
      <div className="flex items-start gap-3">
        {/* Error icon */}
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>

        {/* Error message */}
        <div className="flex-1">
          <h3 className="font-bold text-red-900 mb-1">{title}</h3>
          <p className="text-sm text-red-700 mb-3">{message}</p>

          {/* Retry button */}
          {onRetry && (
            <Button variant="danger" size="sm" onClick={onRetry}>
              <RefreshCw className="w-4 h-4" />
              {retryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// No Search Results State
// ============================================
interface NoSearchResultsProps {
  query: string;
  onClear: () => void;
}

export function NoSearchResults({ query, onClear }: NoSearchResultsProps) {
  return (
    <div className="py-8 text-center px-6">
      {/* Search icon */}
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <span className="text-2xl" role="img" aria-label="Search">
          🔍
        </span>
      </div>

      {/* Message */}
      <h3 className="text-base font-semibold text-slate-900 mb-1">
        No accounts match "{query}"
      </h3>
      <p className="text-sm text-slate-600 mb-4">Try adjusting your search terms</p>

      {/* Clear search button */}
      <button
        onClick={onClear}
        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        Clear search
      </button>
    </div>
  );
}
