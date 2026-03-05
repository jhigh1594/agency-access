'use client';

import { AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import type { AccessRequest } from '@/lib/api/access-requests';

interface ShopifySubmissionPanelProps {
  requested: boolean;
  submission?: AccessRequest['shopifySubmission'];
}

export function ShopifySubmissionPanel({ requested, submission }: ShopifySubmissionPanelProps) {
  if (!requested) {
    return null;
  }

  if (!submission || submission.status === 'pending_client') {
    return (
      <div className="rounded-lg border border-border bg-secondary/10 p-4">
        <div className="flex items-start gap-3">
          <Clock3 className="h-5 w-5 text-secondary mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink">Shopify Submission Pending</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The client still needs to submit their Shopify store domain and collaborator request code.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (submission.status === 'legacy_unreadable') {
    return (
      <div className="rounded-lg border border-coral/30 bg-coral/10 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-coral mt-0.5" />
          <div className="w-full">
            <p className="text-sm font-semibold text-ink">Client Re-confirmation Needed</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This request was created before collaborator codes were retained for agency execution.
            </p>
            {submission.shopDomain && (
              <p className="mt-3 text-xs text-muted-foreground">
                Store domain: <span className="font-mono text-ink">{submission.shopDomain}</span>
              </p>
            )}
            <p className="mt-2 text-sm text-ink">
              Ask the client to re-open the invite link and submit a new collaborator code.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-secondary mt-0.5" />
        <div className="w-full">
          <p className="text-sm font-semibold text-ink">Shopify Submission</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Client details are ready. Use these values when requesting collaborator access in Shopify Partners.
          </p>

          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-border bg-card px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Store Domain</dt>
              <dd className="mt-1 text-sm font-mono text-ink">{submission.shopDomain || 'Not provided'}</dd>
            </div>
            <div className="rounded-md border border-border bg-card px-3 py-2">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">Collaborator Code</dt>
              <dd className="mt-1 text-sm font-mono text-ink">{submission.collaboratorCode || 'Not provided'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
