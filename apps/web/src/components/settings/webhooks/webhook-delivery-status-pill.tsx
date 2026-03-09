import type { WebhookDeliveryStatus } from '@agency-platform/shared';
import { StatusBadge } from '@/components/ui/status-badge';

interface WebhookDeliveryStatusPillProps {
  status: WebhookDeliveryStatus;
}

export function WebhookDeliveryStatusPill({ status }: WebhookDeliveryStatusPillProps) {
  if (status === 'delivered') {
    return <StatusBadge badgeVariant="success">Delivered</StatusBadge>;
  }

  if (status === 'failed') {
    return <StatusBadge status="invalid" />;
  }

  return <StatusBadge status="pending" />;
}
