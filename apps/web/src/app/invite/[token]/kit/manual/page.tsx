'use client';

import { ManualInviteFlow } from '@/components/flow/manual-invite-flow';
import { kitManualConfig } from '../../manual-invite.config';

export default function KitManualPage() {
  return <ManualInviteFlow config={kitManualConfig} />;
}
