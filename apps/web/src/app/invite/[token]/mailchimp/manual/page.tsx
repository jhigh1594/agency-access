'use client';

import { ManualInviteFlow } from '@/components/flow/manual-invite-flow';
import { mailchimpManualConfig } from '../../manual-invite.config';

export default function MailchimpManualPage() {
  return <ManualInviteFlow config={mailchimpManualConfig} />;
}
