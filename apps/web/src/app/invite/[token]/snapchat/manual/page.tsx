'use client';

import { ManualInviteFlow } from '@/components/flow/manual-invite-flow';
import { snapchatManualConfig } from '../../manual-invite.config';

export default function SnapchatManualPage() {
  return <ManualInviteFlow config={snapchatManualConfig} />;
}
