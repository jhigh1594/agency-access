'use client';

import { Card } from '@/components/ui';
import type { AccessRequest } from '@/lib/api/access-requests';
import { ShopifySubmissionPanel } from './shopify-submission-panel';

interface RequestPlatformsCardProps {
  request: AccessRequest;
}

function formatGroup(group: string): string {
  return group.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatProduct(product: string): string {
  return product.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function RequestPlatformsCard({ request }: RequestPlatformsCardProps) {
  const shopifyRequested = request.platforms.some(
    (group) =>
      group.platformGroup === 'shopify' ||
      group.products.some((product) => product.product === 'shopify')
  );

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
