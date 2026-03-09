import type { WebhookEndpointStatus } from '@agency-platform/shared';
import { StatusBadge } from '@/components/ui/status-badge';

interface WebhookStatusBadgeProps {
  status: WebhookEndpointStatus;
}

export function WebhookStatusBadge({ status }: WebhookStatusBadgeProps) {
  if (status === 'active') {
    return <StatusBadge status="active" />;
  }

  return <StatusBadge badgeVariant="default">Disabled</StatusBadge>;
}
