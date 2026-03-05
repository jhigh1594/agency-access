'use client';

import Link from 'next/link';
import { ArrowLeft, Edit3, Plus } from 'lucide-react';
import { Button } from '@/components/ui';

interface RequestActionsBarProps {
  requestId: string;
  status: 'pending' | 'partial' | 'completed' | 'expired' | 'revoked';
  onAction?: (action: 'back_to_dashboard' | 'edit_request' | 'create_from_request') => void;
}

function isEditable(status: RequestActionsBarProps['status']): boolean {
  return status === 'pending' || status === 'partial';
}

export function RequestActionsBar({ requestId, status, onAction }: RequestActionsBarProps) {
  const editable = isEditable(status);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/dashboard" className="inline-flex">
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => onAction?.('back_to_dashboard')}
        >
          Back to Dashboard
        </Button>
      </Link>

      {editable ? (
        <Link
          href={`/access-requests/${requestId}/edit` as any}
          className="inline-flex"
          aria-label="Edit Request"
          onClick={() => onAction?.('edit_request')}
        >
          <Button size="sm" leftIcon={<Edit3 className="h-4 w-4" />}>
            Edit Request
          </Button>
        </Link>
      ) : (
        <Link
          href={`/access-requests/new?fromRequest=${encodeURIComponent(requestId)}` as any}
          className="inline-flex"
          aria-label="Create New Request From This"
          onClick={() => onAction?.('create_from_request')}
        >
          <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
            Create New Request From This
          </Button>
        </Link>
      )}
    </div>
  );
}
