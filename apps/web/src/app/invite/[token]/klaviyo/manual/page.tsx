'use client';

import { ManualInviteFlow } from '@/components/flow/manual-invite-flow';
import { klaviyoManualConfig } from '../../manual-invite.config';

export default function KlaviyoManualPage() {
  return <ManualInviteFlow config={klaviyoManualConfig} />;
}
