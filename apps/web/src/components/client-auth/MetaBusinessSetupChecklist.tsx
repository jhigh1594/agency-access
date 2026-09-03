'use client';

/**
 * MetaBusinessSetupChecklist - Post-creation verification and payment checklist
 *
 * Meta requires a Business Portfolio to be verified and to have a payment
 * method before ad accounts can spend. Assets can still be shared without
 * these, so this is guidance, not a blocker.
 *
 * Acid Brutalism: warning-bordered card (--warning), never a second
 * brutalist element — the view already carries one.
 */

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api/api-env';
import { parseJsonResponse } from '@/lib/api/parse-json-response';

interface MetaBusinessSetupChecklistProps {
  accessRequestToken: string;
  businessId: string;
}

interface CreationLinks {
  businessVerificationUrl?: string;
  paymentMethodUrl?: string;
}

export function MetaBusinessSetupChecklist({
  accessRequestToken,
  businessId,
}: MetaBusinessSetupChecklistProps) {
  const [links, setLinks] = useState<CreationLinks | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLinks = async () => {
      try {
        const response = await fetch(
          `${getApiBaseUrl()}/api/client/${accessRequestToken}/create/meta/links?businessId=${businessId}`
        );
        const json = await parseJsonResponse<{ data?: CreationLinks; error?: { message?: string } }>(
          response,
          { fallbackErrorMessage: 'Failed to load setup links' }
        );
        if (!cancelled && json.data) {
          setLinks(json.data);
        }
      } catch {
        // Non-critical guidance: leave links hidden on failure
      }
    };

    void loadLinks();
    return () => {
      cancelled = true;
    };
  }, [accessRequestToken, businessId]);

  const checklistItems = [
    {
      title: 'Verify your business',
      description: 'Meta needs to confirm your business before ads can spend.',
      url: links?.businessVerificationUrl,
    },
    {
      title: 'Add a payment method',
      description: 'Ad accounts cannot spend until the portfolio has a payment method.',
      url: links?.paymentMethodUrl,
    },
  ];

  return (
    <div
      className="border-2 border-[rgb(var(--warning))] bg-[rgb(var(--warning))]/10 p-4 space-y-3"
      data-testid="meta-business-setup-checklist"
    >
      <div>
        <h3 className="text-sm font-bold text-[rgb(var(--warning))] font-display uppercase tracking-wide">
          Finish setting up this Business Portfolio
        </h3>
        <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
          You can share assets now. Meta requires these two steps before ads can spend.
        </p>
      </div>

      <ul className="space-y-2">
        {checklistItems.map((item) => (
          <li key={item.title} className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[rgb(var(--ink))]">{item.title}</p>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">{item.description}</p>
            </div>
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] shrink-0 items-center gap-1 border-2 border-[rgb(var(--warning))] px-3 text-xs font-bold text-[rgb(var(--warning))] hover:bg-[rgb(var(--warning))]/20"
              >
                Open
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
