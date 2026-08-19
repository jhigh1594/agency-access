'use client';

import { ManualInviteFlow } from '@/components/flow/manual-invite-flow';
import { pinterestManualConfig } from '../../manual-invite.config';

export default function PinterestManualPage() {
  return <ManualInviteFlow config={pinterestManualConfig} />;
}
