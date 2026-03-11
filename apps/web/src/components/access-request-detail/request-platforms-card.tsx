'use client';

import { Card } from '@/components/ui';
import type { AccessRequest } from '@/lib/api/access-requests';
import { PLATFORM_NAMES } from '@agency-platform/shared';
import { ShopifySubmissionPanel } from './shopify-submission-panel';

interface RequestPlatformsCardProps {
  request: AccessRequest;
}

type UnresolvedProduct = NonNullable<
  NonNullable<AccessRequest['authorizationProgress']>['unresolvedProducts']
>[number];

function formatGroup(group: string): string {
  return PLATFORM_NAMES[group as keyof typeof PLATFORM_NAMES] || group.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatProduct(product: string): string {
  return PLATFORM_NAMES[product as keyof typeof PLATFORM_NAMES] || product.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatUnresolvedReason(reason: string): string {
  switch (reason) {
    case 'no_assets':
      return 'No assets found';
    case 'selection_required':
      return 'Selection required';
    default:
      return formatProduct(reason);
  }
}

export function RequestPlatformsCard({ request }: RequestPlatformsCardProps) {
  const shopifyRequested = request.platforms.some(
    (group) =>
      group.platformGroup === 'shopify' ||
      group.products.some((product) => product.product === 'shopify')
  );
  const unresolvedProducts = request.authorizationProgress?.unresolvedProducts || [];

  return (
    <Card className="border-black/10 shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-display text-lg font-semibold text-ink">Requested Platforms</h2>
        <p className="text-sm text-muted-foreground">Products and requested access levels</p>
      </div>

      <div className="p-6">
        {request.platforms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No platforms requested.</p>
        ) : (
          <div className="space-y-4">
            {request.platforms.map((group) => (
              <div key={group.platformGroup}>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  {formatGroup(group.platformGroup)}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.products.map((product) => (
                    <span
                      key={`${group.platformGroup}-${product.product}`}
                      className="inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {formatProduct(product.product)} · {product.accessLevel.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {unresolvedProducts.length > 0 && (
          <div className="mt-5 rounded-md border border-[var(--warning)] bg-[var(--warning)]/10 p-4">
            <p className="text-sm font-semibold text-ink">Still needs follow-up</p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {unresolvedProducts.map((item: UnresolvedProduct) => (
                <li key={`${item.platformGroup}-${item.product}-${item.reason}`}>
                  {formatProduct(item.product)} · {formatUnresolvedReason(item.reason)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5">
          <ShopifySubmissionPanel
            requested={shopifyRequested}
            submission={request.shopifySubmission}
          />
        </div>
      </div>
    </Card>
  );
}
