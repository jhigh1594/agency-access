import type { WebhookDeliverySummary } from '@agency-platform/shared';
import { ChevronRight, Clock3, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WebhookDeliveryStatusPill } from './webhook-delivery-status-pill';

interface WebhookDeliveryInspectorProps {
  deliveries: WebhookDeliverySummary[];
  selectedDeliveryId: string | null;
  onInspect: (deliveryId: string) => void;
}

const EVENT_LABELS: Record<WebhookDeliverySummary['eventType'], string> = {
  'webhook.test': 'Test event',
  'access_request.partial': 'Access request partially completed',
  'access_request.completed': 'Access request completed',
};

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function WebhookDeliveryInspector({
  deliveries,
  selectedDeliveryId,
  onInspect,
}: WebhookDeliveryInspectorProps) {
  if (deliveries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-paper/60 p-5 text-sm text-muted-foreground">
        Delivery history appears here after your first test send or lifecycle event.
      </div>
    );
  }

  const selectedDelivery =
    deliveries.find((delivery) => delivery.id === selectedDeliveryId) ?? deliveries[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
      <div className="space-y-3">
        {deliveries.map((delivery) => {
          const isSelected = delivery.id === selectedDelivery.id;

          return (
            <div
              key={delivery.id}
              className={`rounded-2xl border p-4 transition-colors ${
                isSelected ? 'border-coral bg-coral/5' : 'border-border bg-paper/60'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-ink px-2 py-1 text-xs font-semibold text-paper">
                      {EVENT_LABELS[delivery.eventType]}
                    </code>
                    <WebhookDeliveryStatusPill status={delivery.status} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      Attempt {delivery.attemptNumber}
                    </span>
                    <span>Created {formatDateTime(delivery.createdAt)}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onInspect(delivery.id)}
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Inspect
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <aside className="rounded-2xl border border-border bg-card/70 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ReceiptText className="h-4 w-4 text-coral" />
          Delivery inspector
        </div>

        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Event Type</dt>
            <dd className="mt-1 text-ink">{EVENT_LABELS[selectedDelivery.eventType]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Response</dt>
            <dd className="mt-1 text-ink">
              {selectedDelivery.responseStatus ? `HTTP ${selectedDelivery.responseStatus}` : 'No response recorded'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Delivered At</dt>
            <dd className="mt-1 text-ink">{formatDateTime(selectedDelivery.deliveredAt)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Error</dt>
            <dd className="mt-1 text-ink">{selectedDelivery.errorMessage || 'None'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Payload Preview</dt>
            <dd className="mt-1 rounded-xl border border-border bg-paper/80 p-3 text-xs text-muted-foreground">
              {selectedDelivery.responseBodySnippet || 'Response body was not captured for this attempt.'}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
