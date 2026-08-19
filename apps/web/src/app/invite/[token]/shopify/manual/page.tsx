'use client';

import { ManualInviteFlow } from '@/components/flow/manual-invite-flow';
import { shopifyManualConfig } from '../../manual-invite.config';

export default function ShopifyManualPage() {
  return <ManualInviteFlow config={shopifyManualConfig} />;
}
