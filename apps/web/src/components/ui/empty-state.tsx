/**
 * Empty State Component
 *
 * Displays a placeholder when there's no data to show.
 * Used throughout the app for consistent empty state messaging.
 * Uses design system tokens (ink, muted-foreground, coral).
 */

import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from './button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {Icon && (
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/20 mb-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-medium text-ink">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>
      {(actionLabel && actionHref) && (
        <Link
          href={actionHref as any}
          className="inline-flex items-center justify-center gap-2 mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all min-h-[48px]"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <Button variant="primary" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
