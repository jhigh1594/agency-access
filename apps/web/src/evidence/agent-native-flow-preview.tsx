import ReactDOM from 'react-dom/client';
import { AgentGrantCard } from '@/components/settings/agents/agent-grant-card';
import { ApprovalCard } from '@/components/agent-operations/approval-card';
import type { AgentOperationRecord } from '@/lib/api/agents';
import '@/app/globals.css';

const preview = {
  agency: { id: 'agency-1', name: 'Northstar Growth' }, client: { id: 'client-1', name: 'Acme Outdoor' },
  platforms: ['google_ads', 'ga4'], permissions: ['manage', 'view_only'],
  externalEffect: 'Create one access request and email one authorization link to Acme Outdoor',
  requestingAgent: { grantId: 'grant-1', oauthClientId: 'oauth-chief-of-staff', displayName: 'Chief of Staff' },
  expiresAt: '2026-07-17T12:30:00.000Z', changes: [{ field: 'Google Ads access', before: 'Not requested', after: 'Manage' }],
};

function operation(status: string): AgentOperationRecord {
  return { id: 'op-1', actionType: 'access_request.dispatch', riskClass: 'consequential', status, approvalPreview: preview, expiresAt: preview.expiresAt };
}

function Preview() {
  const scenario = new URLSearchParams(window.location.search).get('scenario') || 'settings';
  if (scenario === 'settings') {
    return <main className="min-h-screen bg-paper p-5 sm:p-10"><div className="mx-auto max-w-4xl space-y-6"><header><p className="text-sm font-semibold text-coral">Settings / Agents</p><h1 className="mt-1 text-3xl font-semibold">Personal agents</h1><p className="mt-2 text-muted-foreground">Connect, constrain, inspect, and revoke delegated agents.</p></header><section className="rounded-xl border border-border bg-card p-6"><h2 className="font-semibold">Remote MCP endpoint</h2><code className="mt-3 block overflow-x-auto rounded-lg bg-muted p-4 text-sm">https://api.authhub.co/mcp</code></section><AgentGrantCard grant={{ id: 'grant-1', agencyId: 'agency-1', displayName: 'Chief of Staff', oauthClientId: 'oauth-chief-of-staff', permissions: ['workspace:read', 'connections:handoff', 'requests:prepare', 'requests:dispatch', 'operations:read'], state: 'active', lastUsedAt: '2026-07-17T11:42:00.000Z', createdAt: '2026-07-16T08:00:00.000Z', updatedAt: '2026-07-17T11:42:00.000Z' }} onRevoke={() => undefined} onUpdate={() => undefined} /></div></main>;
  }
  const status = ['approved', 'declined', 'expired', 'canceled'].includes(scenario) ? scenario : 'pending_approval';
  return <main className="min-h-screen bg-paper p-5 sm:p-10"><div className="mx-auto max-w-3xl"><ApprovalCard operation={operation(status)} onDecision={() => undefined} /></div></main>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Preview />);
