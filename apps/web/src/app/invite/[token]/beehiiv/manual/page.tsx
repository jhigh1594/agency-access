'use client';

import { ManualInviteFlow } from '@/components/flow/manual-invite-flow';
import { beehiivManualConfig } from '../../manual-invite.config';

export default function BeehiivManualPage() {
  return <ManualInviteFlow config={beehiivManualConfig} />;
}
