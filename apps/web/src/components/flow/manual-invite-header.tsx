'use client';

import type { ReactNode } from 'react';
import { InviteHeroHeader } from './invite-hero-header';
import { InviteTrustNote } from './invite-trust-note';

interface ManualInviteHeaderProps {
  agencyName: string;
  platformName: string;
  clientName?: string;
  clientEmail?: string;
  logoUrl?: string;
  backAction?: ReactNode;
  securityNote: string;
}

function buildRecipientSummary(clientName?: string, clientEmail?: string): string {
  if (clientName && clientEmail) {
    return `${clientName} · ${clientEmail}`;
  }

  return clientEmail || clientName || 'This request recipient';
}

export function ManualInviteHeader({
  agencyName,
  platformName,
  clientName,
  clientEmail,
  logoUrl,
  backAction,
  securityNote,
}: ManualInviteHeaderProps) {
  const recipientSummary = buildRecipientSummary(clientName, clientEmail);
  const eyebrow = clientName ? `Request for ${clientName}` : clientEmail ? `Request for ${clientEmail}` : 'Manual invite request';

  return (
    <div className="space-y-4">
      {backAction ? <div className="flex justify-end">{backAction}</div> : null}
      <InviteHeroHeader
        eyebrow={eyebrow}
        title={`Complete ${platformName} access sharing`}
        description={`${agencyName} asked you to use ${platformName}'s native invite flow. Follow the checklist below, send the requested access, and return to finish this authorization request.`}
        badge="Manual invite"
        logoUrl={logoUrl}
        logoAlt={`${agencyName} logo`}
        fallbackMark={agencyName.slice(0, 1).toUpperCase()}
        stats={[
          { label: 'Requested by', value: agencyName },
          { label: 'Recipient', value: recipientSummary },
          { label: 'Platform', value: platformName },
          { label: 'Next', value: `Complete the ${platformName} checklist, then return to the request.` },
        ]}
        aside={<InviteTrustNote description={securityNote} className="max-w-sm" />}
      />
    </div>
  );
}

export type { ManualInviteHeaderProps };
